import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { nisn, date } = await req.json();

    // Toleransi waktu +/- 1 menit untuk menangkap batch transaksi
    const targetDate = new Date(date);
    const startDate = new Date(targetDate.getTime() - 60000);
    const endDate = new Date(targetDate.getTime() + 60000);

    // 1. Ambil dari Daftar Ulang
    const daftarUlang = await prisma.tb_pembayaran_daftar_ulang.findMany({
        where: {
            // Bisa pakai tb_siswa atau tb_daftar_ulang relation, tapi NISN paling aman kalau siswa belum fix
            OR: [
               { tb_siswa: { NISN: nisn } },
               { tb_daftar_ulang: { tb_pendaftaran: { nisn: nisn } } }
            ],
            created_at: { gte: startDate, lte: endDate }
        },
        include: { tb_jenis_pembayaran: true }
    });

    // 2. Ambil dari Pendaftaran (Jaga-jaga ada yang barengan)
    const pendaftaran = await prisma.tb_pembayaran_pendaftaran.findMany({
        where: {
            tb_pendaftaran: { nisn: nisn },
            created_at: { gte: startDate, lte: endDate }
        }
    });

    // 3. Gabung & Format
    const items = [
        ...pendaftaran.map((p: any) => ({
            id: p.id_bayar_pendaftaran,
            type: 'Pendaftaran',
            nama: 'Biaya Pendaftaran',
            nominal: p.nominal,
            status: p.status,
            bukti: p.bukti_pembayaran
        })),
        ...daftarUlang.map((d: any) => ({
            id: d.id_pembayaran_daftar_ulang,
            type: 'DaftarUlang',
            nama: d.tb_jenis_pembayaran?.nama_pembayaran,
            nominal: d.nominal,
            status: d.status,
            bukti: d.bukti_pembayaran
        }))
    ];

    return NextResponse.json({ items });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}