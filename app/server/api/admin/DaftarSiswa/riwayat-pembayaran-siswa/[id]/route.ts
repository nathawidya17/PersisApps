import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ... (Bagian import tetap sama)

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id_siswa = parseInt(resolvedParams.id);
    const { searchParams } = new URL(req.url);
    const id_jenis = searchParams.get("tagihan");

    if (!id_jenis) return NextResponse.json({ error: "ID Jenis Tagihan diperlukan" }, { status: 400 });

    // 1. Ambil Info Tagihan & Nama Siswa
    const [infoTagihan, detailSiswa] = await Promise.all([
      prisma.tb_jenis_pembayaran.findUnique({ where: { id_jenis_pembayaran: Number(id_jenis) } }),
      prisma.tb_siswa.findUnique({ where: { id_siswa }, select: { nama_lengkap: true, NISN: true } })
    ]);

    let gabunganRiwayat: any[] = []; 

    // KASUS A: Tagihan PENDAFTARAN (ID 1)
    if (Number(id_jenis) === 1) {
        if (detailSiswa) {
            const pendaftaran = await prisma.tb_pendaftaran.findFirst({
                where: { nisn: detailSiswa.NISN }, 
                select: { id_pendaftar: true }
            });

            if (pendaftaran) {
                const bayarPendaftaran = await prisma.tb_pembayaran_pendaftaran.findMany({
                    where: { id_pendaftaran: pendaftaran.id_pendaftar },
                    orderBy: { created_at: 'desc' }
                });

                gabunganRiwayat = bayarPendaftaran.map((item: any) => ({
                    id: item.id_bayar_pendaftaran,
                    nominal: item.nominal,
                    status: item.status,
                    bukti_pembayaran: item.bukti_pembayaran,
                    tanggal: item.tanggal_bayar || item.created_at,
                    metode_pembayaran: item.metode_pembayaran,
                    approved_by: item.approved_by,
                    // Tambahkan flag E-Receipt jika Cash
                    isCash: item.metode_pembayaran === 'cash',
                    nama_siswa: detailSiswa.nama_lengkap,
                    nisn_siswa: detailSiswa.NISN
                }));
            }
        }
    } 
    // KASUS B: Tagihan DAFTAR ULANG
    else {
        const bayarDU = await prisma.tb_pembayaran_daftar_ulang.findMany({
            where: { id_siswa: id_siswa, id_jenis_pembayaran: Number(id_jenis) },
            orderBy: { created_at: 'desc' }
        });

        gabunganRiwayat = bayarDU.map((item: any) => ({
            id: item.id_pembayaran_daftar_ulang,
            nominal: item.nominal,
            status: item.status,
            bukti_pembayaran: item.bukti_pembayaran,
            tanggal: item.tanggal_bayar || item.created_at,
            metode_pembayaran: item.metode_pembayaran,
            approved_by: item.approved_by,
            isCash: item.metode_pembayaran === 'cash',
            nama_siswa: detailSiswa?.nama_lengkap || "Siswa",
            nisn_siswa: detailSiswa?.NISN || "-"
        }));
    }

    return NextResponse.json({ infoTagihan, riwayat: gabunganRiwayat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}