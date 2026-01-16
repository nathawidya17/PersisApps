import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Ambil Semua Data Pembayaran
    const pendaftaran = await prisma.tb_pembayaran_pendaftaran.findMany({
      include: { tb_pendaftaran: true },
      orderBy: { created_at: 'desc' }
    });

    const daftarUlang = await prisma.tb_pembayaran_daftar_ulang.findMany({
      include: { 
        tb_jenis_pembayaran: true, // PENTING: Ambil harga asli master
        tb_siswa: true, 
        tb_daftar_ulang: { include: { tb_pendaftaran: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    // 2. Gabungkan Data & Siapkan Field Nominal Asli
    const allTransactions = [
      ...pendaftaran.map((p: any) => ({
        id: p.id_bayar_pendaftaran,
        type: "Pendaftaran",
        nisn: p.tb_pendaftaran?.nisn || "UNKNOWN",
        nama_siswa: p.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        item: "Biaya Pendaftaran",
        
        // Nominal yang tersimpan di transaksi (Bisa jadi Total Bug)
        nominal_db: Number(p.nominal),
        // Nominal Seharusnya (Harga Satuan). Pendaftaran biasanya 200k fix.
        nominal_asli: 200000, 

        status: p.status,
        date: p.created_at,
        metode: p.metode_pembayaran || "cash",
        bukti: p.bukti_pembayaran
      })),
      
      ...daftarUlang.map((d: any) => ({
        id: d.id_pembayaran_daftar_ulang,
        type: "DaftarUlang",
        nisn: d.tb_siswa?.NISN || d.tb_daftar_ulang?.tb_pendaftaran?.nisn || "UNKNOWN",
        nama_siswa: d.tb_siswa?.nama_lengkap || d.tb_daftar_ulang?.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        item: d.tb_jenis_pembayaran?.nama_pembayaran || "Item",
        
        // Nominal yang tersimpan di transaksi (Bisa jadi Total Bug)
        nominal_db: Number(d.nominal),
        // Nominal Seharusnya (Harga Satuan Master)
        nominal_asli: Number(d.tb_jenis_pembayaran?.nominal || 0),

        status: d.status,
        date: d.created_at,
        metode: d.metode_pembayaran || "cash",
        bukti: d.bukti_pembayaran
      }))
    ];

    // 3. GROUPING LOGIC (NISN + Menit yang sama)
    const groups: any = {};

    allTransactions.forEach(trx => {
        if (!trx.date) return;
        
        const dateObj = new Date(trx.date);
        const timeKey = dateObj.toISOString().slice(0, 16); 
        const groupKey = `${trx.nisn}_${timeKey}`;

        if (!groups[groupKey]) {
            groups[groupKey] = {
                group_id: groupKey,
                nisn: trx.nisn,
                nama_siswa: trx.nama_siswa,
                date: trx.date,
                // Kita hitung nanti setelah semua item terkumpul
                total_nominal: 0, 
                jumlah_item: 0,
                status_summary: [],
                items: [] 
            };
        }

        groups[groupKey].jumlah_item += 1;
        groups[groupKey].status_summary.push(trx.status);
        groups[groupKey].items.push(trx);
    });

    // 4. Format Output List & FIX NOMINAL BUG
    const result = Object.values(groups).map((g: any) => {
        const items = g.items;
        
        // --- LOGIC PERBAIKAN TOTAL BAYAR ---
        const sumStored = items.reduce((acc: number, curr: any) => acc + curr.nominal_db, 0);
        const sumMaster = items.reduce((acc: number, curr: any) => acc + curr.nominal_asli, 0);
        
        // Cek apakah semua nominal di DB identik (Tanda Bug Duplikasi Total)
        const firstNominal = items[0].nominal_db;
        const allNominalsAreSame = items.every((i: any) => i.nominal_db === firstNominal);

        // LOGIC:
        // Jika item lebih dari 1 DAN nominal semua sama DAN Total di DB jauh lebih besar dari Total Master
        // Maka ini adalah Bug "Total Tersimpan di Setiap Baris".
        // Solusinya: Ambil nilai dari SALAH SATU baris saja.
        if (items.length > 1 && allNominalsAreSame && sumStored > sumMaster) {
             g.total_nominal = firstNominal; 
        } else {
             // Normal Case (SPP atau Item Satuan): Jumlahkan semua
             g.total_nominal = sumStored;
        }

        // --- Logic Status ---
        const rawStatuses = g.status_summary;
        let finalVerifStatus = "NEED APPROVAL";
        const isPending = rawStatuses.some((s: string) => s === 'belum' || s === 'menunggu');
        const isRejected = rawStatuses.some((s: string) => s === 'ditolak' || s === 'Rejected');

        if (isPending) finalVerifStatus = "NEED APPROVAL";
        else if (isRejected) finalVerifStatus = "Rejected";
        else finalVerifStatus = "Approved";

        // --- Logic Lunas/Cicil ---
        let finalPaymentStatus = "Belum";
        if (rawStatuses.includes('cicil')) finalPaymentStatus = "Cicil";
        else if (rawStatuses.includes('lunas')) finalPaymentStatus = "Lunas";

        const listItems = g.items.map((i: any) => i.item).join(", ");

        return {
            group_id: g.group_id,
            nisn: g.nisn,
            nama_siswa: g.nama_siswa,
            date: g.date,
            
            // Field yang dikirim ke Frontend
            total_nominal: g.total_nominal, 
            jumlah_item: g.jumlah_item,
            list_items: listItems, 
            status: finalVerifStatus,
            status_pembayaran: finalPaymentStatus,
            
            metode: g.items[0]?.metode || "cash", 
            bukti_utama: g.items[0]?.bukti || null 
        };
    });

    // Sorting Terbaru
    result.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}