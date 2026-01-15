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

    // 2. Gabungkan Data & MAP FIELD 'metode_pembayaran'
    const allTransactions = [
      ...pendaftaran.map((p: any) => ({
        id: p.id_bayar_pendaftaran,
        type: "Pendaftaran",
        nisn: p.tb_pendaftaran?.nisn || "UNKNOWN",
        nama_siswa: p.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        item: "Biaya Pendaftaran",
        nominal: Number(p.nominal),
        status: p.status,
        date: p.created_at,
        metode: p.metode_pembayaran || "cash", // Fix: Ambil metode dari DB
        bukti: p.bukti_pembayaran
      })),
      ...daftarUlang.map((d: any) => ({
        id: d.id_pembayaran_daftar_ulang,
        type: "DaftarUlang",
        nisn: d.tb_siswa?.NISN || d.tb_daftar_ulang?.tb_pendaftaran?.nisn || "UNKNOWN",
        nama_siswa: d.tb_siswa?.nama_lengkap || d.tb_daftar_ulang?.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        item: d.tb_jenis_pembayaran?.nama_pembayaran || "Item",
        nominal: Number(d.nominal),
        status: d.status,
        date: d.created_at,
        metode: d.metode_pembayaran || "cash", // Fix: Ambil metode dari DB
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
                total_nominal: 0,
                jumlah_item: 0,
                status_summary: [],
                items: [] // Array untuk menampung item detail
            };
        }

        groups[groupKey].total_nominal += trx.nominal;
        groups[groupKey].jumlah_item += 1;
        groups[groupKey].status_summary.push(trx.status);
        groups[groupKey].items.push(trx);
    });

    // 4. Format Output List
    const result = Object.values(groups).map((g: any) => {
        const rawStatuses = g.status_summary;
        let finalStatus = "NEED APPROVAL";

        // Logic Status: Kalau ada yang 'belum'/'menunggu' -> Need Approval
        const isPending = rawStatuses.some((s: string) => s === 'belum' || s === 'menunggu');
        const isRejected = rawStatuses.some((s: string) => s === 'ditolak' || s === 'Rejected');

        if (isPending) {
            finalStatus = "NEED APPROVAL";
        } else if (isRejected) {
            finalStatus = "Rejected";
        } else {
            // Lunas atau Cicil -> Approved
            finalStatus = "Approved";
        }

        // --- FEATURE: LIST NAMA ITEM UNTUK EXCEL ---
        // Menggabungkan nama item dengan koma (contoh: "SPP Juli, Uang Gedung")
        const listItems = g.items.map((i: any) => i.item).join(", ");

        return {
            group_id: g.group_id,
            nisn: g.nisn,
            nama_siswa: g.nama_siswa,
            date: g.date,
            total_nominal: g.total_nominal,
            jumlah_item: g.jumlah_item,
            list_items: listItems, // <--- Field baru untuk rincian item di Excel
            status: finalStatus,
            metode: g.items[0]?.metode || "cash", // Ambil metode dari item pertama
            bukti_utama: g.items[0]?.bukti || null 
        };
    });

    // --- FIX SORTING: TERBARU DI ATAS ---
    // Menggunakan field 'date' yang valid, bukan 'waktu_transaksi'
    result.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}