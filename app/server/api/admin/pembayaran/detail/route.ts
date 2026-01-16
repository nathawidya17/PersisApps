import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { nisn, date } = await req.json();

    // Toleransi waktu +/- 1 menit untuk menangkap batch transaksi
    const targetDate = new Date(date);
    const startDate = new Date(targetDate.getTime() - 60000);
    const endDate = new Date(targetDate.getTime() + 60000);

    // 1. Ambil dari Daftar Ulang (INCLUDE Master Data Harga)
    const daftarUlang = await prisma.tb_pembayaran_daftar_ulang.findMany({
        where: {
            OR: [
               { tb_siswa: { NISN: nisn } },
               { tb_daftar_ulang: { tb_pendaftaran: { nisn: nisn } } }
            ],
            created_at: { gte: startDate, lte: endDate }
        },
        include: { tb_jenis_pembayaran: true } // PENTING: Ambil harga asli
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
            nominal_db: Number(p.nominal), // Nominal tersimpan (Mungkin Error Total)
            nominal_master: 200000,        // Harga Asli Pendaftaran (Default/Hardcode)
            status: p.status,
            bukti: p.bukti_pembayaran
        })),
        ...daftarUlang.map((d: any) => ({
            id: d.id_pembayaran_daftar_ulang,
            type: 'DaftarUlang',
            nama: d.tb_jenis_pembayaran?.nama_pembayaran,
            nominal_db: Number(d.nominal), // Nominal tersimpan (Mungkin Error Total)
            nominal_master: Number(d.tb_jenis_pembayaran?.nominal || 0), // Harga Asli dari Master
            status: d.status,
            bukti: d.bukti_pembayaran
        }))
    ];

    // 4. LOGIC FIX BUG: DETEKSI TOTAL DUPLIKAT
    // Masalah: DB menyimpan Total (misal 750k) di setiap baris item (Pendaftaran, Sampul, Baju)
    // Solusi: Jika semua nominal di DB SAMA PERSIS, ganti dengan Nominal Master.
    
    if (rawItems.length > 1) {
        // Ambil nominal pertama sebagai patokan
        const firstNominal = rawItems[0].nominal_db;
        
        // Cek apakah SEMUA item memiliki nominal yang sama persis (Ciri khas bug ini)
        const isAllSame = rawItems.every(item => item.nominal_db === firstNominal);
        
        // Hitung total master (seharusnya)
        const totalMaster = rawItems.reduce((sum, item) => sum + item.nominal_master, 0);

        // Jika semua nominal sama DAN nominal tersebut jauh lebih besar dari harga master
        // Maka kita FORCE pakai harga master
        if (isAllSame && firstNominal >= totalMaster && totalMaster > 0) {
             rawItems = rawItems.map(item => ({
                 ...item,
                 // Gunakan harga master jika ada, jika 0 kembalikan ke db (fallback)
                 nominal_db: item.nominal_master > 0 ? item.nominal_master : item.nominal_db
             }));
        }
    }

    // 5. Format Final untuk Frontend
    const items = rawItems.map(item => ({
        id: item.id,
        type: item.type,
        nama: item.nama,
        nominal: item.nominal_db, // Ini sekarang sudah nominal yang BENAR (bukan total)
        status: item.status,
        bukti: item.bukti
    }));

    return NextResponse.json({ items });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}