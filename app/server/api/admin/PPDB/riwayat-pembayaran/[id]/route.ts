import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      orderBy: { created_at: 'desc' }
    });

    // Ambil data pembayaran daftar ulang
    const daftarUlang = await prisma.tb_daftar_ulang.findFirst({
      where: { id_pendaftar: id_pendaftar },
      include: { 
        tb_pembayaran_daftar_ulang: {
          orderBy: { created_at: 'desc' }
        } 
      }
    });

    const bayarDaftarUlang = daftarUlang?.tb_pembayaran_daftar_ulang || [];

    // Gabungkan riwayat
    const gabunganRiwayat = [...bayarPendaftaran, ...bayarDaftarUlang]
      .map((item: any) => {
        const jenisId = item.id_jenis_pembayaran || 1;

        return {
          id: item.id_bayar_pendaftaran || item.id_pembayaran_daftar_ulang,
          nominal: item.nominal,
          status: item.status,
          bukti_pembayaran: item.bukti_pembayaran,
          tanggal: item.tanggal_bayar || item.created_at,
          
          // --- TAMBAHKAN INI AGAR MUNCUL DI FRONTEND ---
          metode_pembayaran: item.metode_pembayaran, 
          // ---------------------------------------------

          jenis_id: jenisId,
          sumber: item.id_bayar_pendaftaran ? 'pendaftaran' : 'daftar_ulang'
        };
      })
      .filter((item) => Number(item.jenis_id) === Number(id_jenis))
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    return NextResponse.json({ 
      infoTagihan, 
      riwayat: gabunganRiwayat 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}