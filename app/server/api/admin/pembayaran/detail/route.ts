import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { nisn, date } = await req.json();

    const targetDate = new Date(date);
    const startDate = new Date(targetDate.getTime() - 60000);
    const endDate = new Date(targetDate.getTime() + 60000);

    // 1. Ambil dari Daftar Ulang
    const daftarUlang = await prisma.tb_pembayaran_daftar_ulang.findMany({
        where: {
            OR: [
               { tb_siswa: { NISN: nisn } },
               { tb_daftar_ulang: { tb_pendaftaran: { nisn: nisn } } }
            ],
            created_at: { gte: startDate, lte: endDate }
        },
        include: { tb_jenis_pembayaran: true } 
    });

    // 2. Ambil dari Pendaftaran
    const pendaftaran = await prisma.tb_pembayaran_pendaftaran.findMany({
        where: {
            tb_pendaftaran: { nisn: nisn },
            created_at: { gte: startDate, lte: endDate }
        }
    });

    // 3. Gabung Data Raw (Siapkan Field untuk Deteksi Bug)
    let rawItems = [
        ...pendaftaran.map((p: any) => ({
            id: p.id_bayar_pendaftaran,
            type: 'Pendaftaran',
            nama: 'Biaya Pendaftaran',
            nominal_db: Number(p.nominal), 
            // FIX: Ganti nominal master jadi 199.000
            nominal_master: 199000,        
            status: p.status,
            bukti: p.bukti_pembayaran
        })),
        ...daftarUlang.map((d: any) => ({
            id: d.id_pembayaran_daftar_ulang,
            type: 'DaftarUlang',
            nama: d.tb_jenis_pembayaran?.nama_pembayaran,
            nominal_db: Number(d.nominal), 
            nominal_master: Number(d.tb_jenis_pembayaran?.nominal || 0), 
            status: d.status,
            bukti: d.bukti_pembayaran
        }))
    ];

    // 4. LOGIC FIX BUG: DETEKSI TOTAL DUPLIKAT
    if (rawItems.length > 1) {
        const firstNominal = rawItems[0].nominal_db;
        const isAllSame = rawItems.every(item => item.nominal_db === firstNominal);
        const totalMaster = rawItems.reduce((sum, item) => sum + item.nominal_master, 0);

        if (isAllSame && firstNominal >= totalMaster && totalMaster > 0) {
             rawItems = rawItems.map(item => ({
                 ...item,
                 nominal_db: item.nominal_master > 0 ? item.nominal_master : item.nominal_db
             }));
        }
    }

    // 5. Format Final untuk Frontend
    const items = rawItems.map(item => ({
        id: item.id,
        type: item.type,
        nama: item.nama,
        nominal: item.nominal_db, 
        status: item.status,
        bukti: item.bukti
    }));

    return NextResponse.json({ items });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}