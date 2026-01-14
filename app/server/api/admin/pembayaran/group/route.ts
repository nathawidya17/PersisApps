import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Ambil Semua Data Pembayaran (Mentah)
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

    // 2. Gabungkan Data
    const allTransactions = [
      ...pendaftaran.map((p: any) => ({
        id: p.id_bayar_pendaftaran,
        type: "Pendaftaran",
        nisn: p.tb_pendaftaran?.nisn || "UNKNOWN",
        nama_siswa: p.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        item: "Biaya Pendaftaran",
        nominal: p.nominal,
        status: p.status,
        date: p.created_at,
        bukti: p.bukti_pembayaran
      })),
      ...daftarUlang.map((d: any) => ({
        id: d.id_pembayaran_daftar_ulang,
        type: "DaftarUlang",
        nisn: d.tb_siswa?.NISN || d.tb_daftar_ulang?.tb_pendaftaran?.nisn || "UNKNOWN",
        nama_siswa: d.tb_siswa?.nama_lengkap || d.tb_daftar_ulang?.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        item: d.tb_jenis_pembayaran?.nama_pembayaran || "Item",
        nominal: d.nominal,
        status: d.status,
        date: d.created_at,
        bukti: d.bukti_pembayaran
      }))
    ];

    // 3. GROUPING LOGIC (By NISN + Tanggal/Jam yang sama)
    // Kita anggap transaksi yg dibuat dalam rentang 1 menit yg sama adalah "Satu Batch"
    const groups: any = {};

    allTransactions.forEach(trx => {
        if (!trx.date) return;
        
        // Key Grouping: NISN + Waktu (Menit)
        const timeKey = new Date(trx.date).toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
        const groupKey = `${trx.nisn}_${timeKey}`;

        if (!groups[groupKey]) {
            groups[groupKey] = {
                group_id: groupKey,
                nisn: trx.nisn,
                nama_siswa: trx.nama_siswa,
                date: trx.date,
                total_nominal: 0,
                total_items: 0,
                status_summary: [],
                items: [] // Simpan detail item buat preview
            };
        }

        groups[groupKey].total_nominal += trx.nominal;
        groups[groupKey].total_items += 1;
        groups[groupKey].status_summary.push(trx.status);
        groups[groupKey].items.push(trx);
    });

    // 4. Format Output List
    const result = Object.values(groups).map((g: any) => {
        // Tentukan Status Global Group
        const allStatus = g.status_summary;
        let finalStatus = "Menunggu";
        if (allStatus.every((s: string) => s === 'lunas')) finalStatus = "Approved";
        else if (allStatus.some((s: string) => s === 'ditolak')) finalStatus = "Rejected";
        else if (allStatus.some((s: string) => s === 'menunggu')) finalStatus = "Need Approval";

        return {
            group_id: g.group_id,
            nisn: g.nisn,
            nama_siswa: g.nama_siswa,
            date: g.date,
            total_nominal: g.total_nominal,
            jumlah_item: g.total_items,
            status: finalStatus,
            bukti_utama: g.items[0]?.bukti || null 
        };
    });

    // Sort by Date Descending
    result.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}