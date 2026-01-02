import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Ambil detail siswa & riwayat pembayaran
  const detailSiswa = await prisma.tb_siswa.findUnique({
    where: { id_siswa: Number(id) },
    include: { 
      tb_orang_tua: true,
      tb_pembayaran_daftar_ulang: true 
    }
  });

  // 2. AMBIL MASTER TAGIHAN (Penting agar tabel tidak kosong)
  const jenisTagihan = await prisma.tb_jenis_pembayaran.findMany();

  return NextResponse.json({ detailSiswa, jenisTagihan });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nama_lengkap, jenis_kelamin, no_hp, email, alamat, id_ortu, nama_ayah, pekerjaan_ayah, nama_ibu, pekerjaan_ibu } = body;

    await prisma.$transaction(async (tx) => {
      await tx.tb_siswa.update({
        where: { id_siswa: Number(id) },
        data: { nama_lengkap, jenis_kelamin, no_hp, email, alamat }
      });
      if (id_ortu) {
        await tx.tb_orang_tua.update({
          where: { id_ortu: Number(id_ortu) },
          data: { nama_ayah, pekerjaan_ayah, nama_ibu, pekerjaan_ibu }
        });
      }
    });
    return NextResponse.json({ message: "Update Berhasil" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const idSiswa = Number(resolvedParams.id);

    if (isNaN(idSiswa)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      await tx.tb_pembayaran_daftar_ulang.deleteMany({ where: { id_siswa: idSiswa } });
      await tx.tb_dokumen.deleteMany({ where: { id_siswa: idSiswa } });
      await tx.tb_prestasi.deleteMany({ where: { id_siswa: idSiswa } });
      await tx.tb_orang_tua.deleteMany({ where: { id_siswa: idSiswa } });
      await tx.tb_siswa.delete({ where: { id_siswa: idSiswa } });
    });

    return NextResponse.json({ message: "Hapus Berhasil" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}