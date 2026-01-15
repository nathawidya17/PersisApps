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
        tb_jenis_pembayaran: true,
        tb_siswa: true, 
        tb_daftar_ulang: { include: { tb_pendaftaran: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    // 2. Gabungkan Data dengan penamaan field yang konsisten
    const allTransactions = [
      ...pendaftaran.map((p: any) => ({
        id: p.id_bayar_pendaftaran,
        type: "Pendaftaran",
        nisn: p.tb_pendaftaran?.nisn || "UNKNOWN", // Konsisten pakai 'nisn' kecil
        nama_siswa: p.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        item: "Biaya Pendaftaran",
        nominal: Number(p.nominal),
        status: p.status,
        date: p.created_at,
        bukti: p.bukti_pembayaran
      })),
      ...daftarUlang.map((d: any) => ({
        id: d.id_pembayaran_daftar_ulang,
        type: "DaftarUlang",
        // Ambil NISN dari tb_siswa atau fallback ke tb_pendaftaran
        nisn: d.tb_siswa?.NISN || d.tb_daftar_ulang?.tb_pendaftaran?.nisn || "UNKNOWN",
        nama_siswa: d.tb_siswa?.nama_lengkap || d.tb_daftar_ulang?.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        item: d.tb_jenis_pembayaran?.nama_pembayaran || "Item",
        nominal: Number(d.nominal),
        status: d.status,
        date: d.created_at,
        bukti: d.bukti_pembayaran
      }))
    ];

    // 3. GROUPING LOGIC (NISN + Menit yang sama)
    const groups: any = {};

    allTransactions.forEach(trx => {
        if (!trx.date) return;
        
        const dateObj = new Date(trx.date);
        // Bikin key unik per menit: NISN_YYYY-MM-DDTHH:mm
        const timeKey = dateObj.toISOString().slice(0, 16); 
        const groupKey = `${trx.nisn}_${timeKey}`;

        if (!groups[groupKey]) {
            groups[groupKey] = {
                group_id: groupKey,
                nisn: trx.nisn,
                nama_siswa: trx.nama_siswa,
                date: trx.date,
                total_nominal: 0,
                jumlah_item: 0,
                status_summary: [],
                items: []
            };
        }

        groups[groupKey].total_nominal += trx.nominal;
        groups[groupKey].jumlah_item += 1;
        groups[groupKey].status_summary.push(trx.status);
        groups[groupKey].items.push(trx);
    });

    // 4. Format Output List dengan Logic Status Baru
    const result = Object.values(groups).map((g: any) => {
        const rawStatuses = g.status_summary;
        let finalStatus = "NEED APPROVAL";

        // Cek apakah ada yang masih 'belum' atau 'menunggu'
        const isPending = rawStatuses.some((s: string) => s === 'belum' || s === 'menunggu');
        // Cek apakah ada yang ditolak
        const isRejected = rawStatuses.some((s: string) => s === 'ditolak' || s === 'Rejected');

        if (isPending) {
            finalStatus = "NEED APPROVAL";
        } else if (isRejected) {
            finalStatus = "Rejected";
        } else {
            // Jika isinya 'lunas' atau 'cicil' semua, maka APPROVED
            finalStatus = "Approved";
        }

        return {
            group_id: g.group_id,
            nisn: g.nisn, // NISN ini yang akan muncul di tabel
            nama_siswa: g.nama_siswa,
            date: g.date,
            total_nominal: g.total_nominal,
            jumlah_item: g.jumlah_item,
            status: finalStatus,
            bukti_utama: g.items[0]?.bukti || null 
        };
    });

    // Sort by Date Descending
    result.sort((a: any, b: any) => new Date(b.waktu_transaksi).getTime() - new Date(a.waktu_transaksi).getTime());

    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}