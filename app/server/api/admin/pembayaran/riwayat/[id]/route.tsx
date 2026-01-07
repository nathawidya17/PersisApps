import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id_pendaftar = parseInt(resolvedParams.id);

    const { searchParams } = new URL(req.url);
    const id_jenis = searchParams.get("tagihan");

    if (!id_jenis) {
      return NextResponse.json({ error: "ID Jenis Tagihan diperlukan" }, { status: 400 });
    }

    // Ambil data header
    const infoTagihan = await prisma.tb_jenis_pembayaran.findUnique({
      where: { id_jenis_pembayaran: Number(id_jenis) }
    });

    // Ambil data pembayaran pendaftaran
    const bayarPendaftaran = await prisma.tb_pembayaran_pendaftaran.findMany({
      where: { id_pendaftaran: id_pendaftar },
    });

    // Ambil data pembayaran daftar ulang
    const daftarUlang = await prisma.tb_daftar_ulang.findFirst({
      where: { id_pendaftar: id_pendaftar },
      include: { tb_pembayaran_daftar_ulang: true }
    });

    const bayarDaftarUlang = daftarUlang?.tb_pembayaran_daftar_ulang || [];

    // Gabungkan riwayat
    const gabunganRiwayat = [...bayarPendaftaran, ...bayarDaftarUlang]
      .filter((item: any) => {
        const itemJenisId = item.id_jenis_pembayaran || 1;
        return Number(itemJenisId) === Number(id_jenis);
      })
      .sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    return NextResponse.json({ 
      infoTagihan, 
      riwayat: gabunganRiwayat 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}