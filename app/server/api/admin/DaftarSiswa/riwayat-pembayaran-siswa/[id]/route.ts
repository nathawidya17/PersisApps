import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    // INI ADALAH ID SISWA
    const id_siswa = parseInt(resolvedParams.id);

    const { searchParams } = new URL(req.url);
    const id_jenis = searchParams.get("tagihan");

    if (!id_jenis) {
      return NextResponse.json({ error: "ID Jenis Tagihan diperlukan" }, { status: 400 });
    }

    // 1. Ambil Info Tagihan
    const infoTagihan = await prisma.tb_jenis_pembayaran.findUnique({
      where: { id_jenis_pembayaran: Number(id_jenis) }
    });

    // --- PERBAIKAN DISINI (Tambahkan : any[]) ---
    let gabunganRiwayat: any[] = []; 
    // -------------------------------------------

    // KASUS A: Tagihan PENDAFTARAN (ID 1)
    if (Number(id_jenis) === 1) {
        
        // Cari NISN siswa ini dulu
        const siswa = await prisma.tb_siswa.findUnique({
            where: { id_siswa: id_siswa },
            select: { NISN: true }
        });

        if (siswa) {
            // Cari data pendaftaran aslinya via NISN
            const pendaftaran = await prisma.tb_pendaftaran.findFirst({
                where: { nisn: siswa.NISN }, 
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
                    jenis_id: 1,
                    sumber: 'pendaftaran'
                }));
            }
        }
    } 
    
    // KASUS B: Tagihan DAFTAR ULANG (ID > 1)
    else {
        const bayarDU = await prisma.tb_pembayaran_daftar_ulang.findMany({
            where: { 
                id_siswa: id_siswa, 
                id_jenis_pembayaran: Number(id_jenis)
            },
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
            jenis_id: item.id_jenis_pembayaran,
            sumber: 'daftar_ulang'
        }));
    }

    return NextResponse.json({ 
      infoTagihan, 
      riwayat: gabunganRiwayat 
    });

  } catch (error: any) {
    console.error("Error Riwayat Siswa API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}