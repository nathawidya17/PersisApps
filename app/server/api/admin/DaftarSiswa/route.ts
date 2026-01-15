import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterTagihanByGender } from "@/lib/validationByGender";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Hitung Target (FIXED: HAPUS 200000)
    const jenisTagihan = await prisma.tb_jenis_pembayaran.findMany({ where: { status: 'aktif' } });
    const TARGET_TAGIHAN = jenisTagihan.reduce((a, b) => a + b.nominal, 0);

    // 2. Ambil Data
    const rawSiswa = await prisma.tb_siswa.findMany({
      orderBy: { updated_at: 'desc' },
      include: {
        tb_pembayaran_daftar_ulang: true, 
        tb_orang_tua: true
      }
    });

    const rawPendaftaran = await prisma.tb_pendaftaran.findMany({
        select: { nisn: true, tb_pembayaran_pendaftaran: true }
    });

    const mapBayarPend = new Map<string, number>();
    rawPendaftaran.forEach(p => {
        const total = p.tb_pembayaran_pendaftaran
            .filter(bayar => bayar.status === 'lunas')
            .reduce((acc, curr) => acc + curr.nominal, 0);
        if (p.nisn) mapBayarPend.set(p.nisn, total);
    });

    // 3. Hitung
    const processedData = rawSiswa.map((siswa) => {
        const uangPend = mapBayarPend.get(siswa.NISN) || 0;
        const uangDU = siswa.tb_pembayaran_daftar_ulang
            .filter(p => p.status === 'lunas')
            .reduce((acc, curr) => acc + curr.nominal, 0);

        // Filter tagihan sesuai jenis kelamin untuk TARGET yang akurat
        const tagihanForGender = filterTagihanByGender(jenisTagihan, siswa.jenis_kelamin);
        const targetForStudent = tagihanForGender.reduce((a, b) => a + b.nominal, 0);

        const totalMasuk = uangPend + uangDU;
        const isLunas = totalMasuk >= targetForStudent;

        return {
            ...siswa,
            id: siswa.id_siswa,
            id_siswa: siswa.id_siswa,
            nama_ayah: siswa.tb_orang_tua[0]?.nama_ayah || "-",
            nama_ibu: siswa.tb_orang_tua[0]?.nama_ibu || "-",
            status_pembayaran: isLunas ? 'lunas' : 'belum_lunas'
        };
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}