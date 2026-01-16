import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterTagihanByGender } from "@/lib/validationByGender";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Ambil Master Tagihan Aktif
    const jenisTagihan = await prisma.tb_jenis_pembayaran.findMany({ where: { status: 'aktif' } });

    // 2. Ambil Data Siswa (Include Pembayaran & Ortu)
    const rawSiswa = await prisma.tb_siswa.findMany({
      orderBy: { updated_at: 'desc' },
      include: {
        tb_pembayaran_daftar_ulang: true, 
        tb_orang_tua: true
      }
    });

    // 3. Ambil Data Pendaftaran (Untuk cek pembayaran 199rb)
    // Kita perlu data pembayaran pendaftaran spesifik untuk setiap siswa
    const rawPendaftaran = await prisma.tb_pendaftaran.findMany({
        select: { 
            nisn: true, 
            tb_pembayaran_pendaftaran: true 
        }
    });

    // Map untuk akses cepat data pendaftaran by NISN
    const mapPendData = new Map<string, any[]>();
    rawPendaftaran.forEach(p => {
        if (p.nisn) mapPendData.set(p.nisn, p.tb_pembayaran_pendaftaran);
    });

    // 4. PROSES DATA SISWA & RINCIANNYA
    const processedData = rawSiswa.map((siswa) => {
        
        // --- A. Hitung Pembayaran Pendaftaran ---
        const historyPend = mapPendData.get(siswa.NISN) || [];
        const bayarPend = historyPend
            .filter((p: any) => ['lunas', 'cicil'].includes(p.status))
            .reduce((acc: number, curr: any) => acc + Number(curr.nominal), 0);
            
        // Logic Fix Pendaftaran 199rb -> Lunas
        const targetPend = 199000;
        const statusPend = (bayarPend >= targetPend || bayarPend >= 199000) ? 'Lunas' : 'Belum';
        const displayBayarPend = (statusPend === 'Lunas') ? targetPend : bayarPend;

        // --- B. Hitung Tagihan Daftar Ulang (Per Item) ---
        // Filter tagihan sesuai gender siswa
        const tagihanSiswa = filterTagihanByGender(jenisTagihan, siswa.jenis_kelamin);
        
        // Array untuk menampung rincian per item (Untuk Excel)
        let rincianExcel: any[] = [];

        // 1. Masukkan Biaya Pendaftaran ke Rincian
        rincianExcel.push({
            nama_tagihan: "Biaya Pendaftaran",
            nominal_tagihan: targetPend,
            terbayar: displayBayarPend,
            status: statusPend,
            tanggal_bayar: historyPend.length > 0 ? new Date(historyPend[0].created_at).toLocaleDateString('id-ID') : '-'
        });

        let totalTargetDU = 0;
        let totalBayarDU = 0;

        // 2. Loop Tagihan Daftar Ulang
        tagihanSiswa.forEach(tagihan => {
            totalTargetDU += Number(tagihan.nominal);
            
            // Cari pembayaran untuk item ini
            const payment = siswa.tb_pembayaran_daftar_ulang.find(
                p => p.id_jenis_pembayaran === tagihan.id_jenis_pembayaran
            );

            let nominalBayar = 0;
            let statusItem = "Belum Lunas";
            let tanggalBayar = "-";

            if (payment) {
                const rawNominal = Number(payment.nominal);
                const hargaAsli = Number(tagihan.nominal);

                // === LOGIC ANTI-BUG EXCEL ===
                // Jika status Lunas, tapi nominal di DB jauh lebih besar dari harga asli (Bug Total),
                // Maka paksa tampilkan harga asli agar di Excel tidak muncul 3 Juta.
                if (payment.status === 'lunas') {
                    if (rawNominal > hargaAsli * 1.5) {
                        nominalBayar = hargaAsli; // Fix Bug
                    } else {
                        nominalBayar = rawNominal;
                    }
                    statusItem = "Lunas";
                } else if (payment.status === 'cicil') {
                    nominalBayar = rawNominal;
                    statusItem = "Cicil";
                } else if (payment.status === 'belum') {
                    nominalBayar = rawNominal; // Tampilkan saja walau belum verif
                    statusItem = "Menunggu";
                }
                
                tanggalBayar = new Date(payment.created_at).toLocaleDateString('id-ID');
            }

            totalBayarDU += nominalBayar;

            // Push ke array rincian
            rincianExcel.push({
                nama_tagihan: tagihan.nama_pembayaran,
                nominal_tagihan: Number(tagihan.nominal),
                terbayar: nominalBayar, // <--- INI SUDAH ANGKA PER ITEM
                status: statusItem,
                tanggal_bayar: tanggalBayar
            });
        });

        // --- C. Hitung Status Global ---
        const grandTotalTarget = totalTargetDU + targetPend;
        const grandTotalBayar = totalBayarDU + displayBayarPend;
        
        // Toleransi selisih 1000 perak
        const isLunasGlobal = grandTotalBayar >= (grandTotalTarget - 1000);

        return {
            ...siswa,
            id: siswa.id_siswa,
            id_siswa: siswa.id_siswa,
            nama_ayah: siswa.tb_orang_tua[0]?.nama_ayah || "-",
            nama_ibu: siswa.tb_orang_tua[0]?.nama_ibu || "-",
            
            // Status untuk Tabel Admin
            status_pembayaran: isLunasGlobal ? 'lunas' : 'belum_lunas',
            
            // Data Tambahan Khusus Export Excel
            // Frontend tinggal loop array ini untuk membuat baris Excel
            detail_tagihan: rincianExcel 
        };
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}