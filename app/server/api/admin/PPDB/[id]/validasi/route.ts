import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id_pendaftar = parseInt(params.id);

    const dataAwal = await prisma.tb_pendaftaran.findUnique({
      where: { id_pendaftar },
      include: { tb_daftar_ulang: true }
    });

    if (!dataAwal) return NextResponse.json({ error: "Data tidak ada" }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create ke tb_siswa
      const siswa = await tx.tb_siswa.create({
        data: {
          NISN: dataAwal.nisn.substring(0, 10),
          nama_lengkap: dataAwal.nama_lengkap,
          tempat_lahir: dataAwal.tempat_lahir,
          tanggal_lahir: dataAwal.tanggal_lahir,
          jenis_kelamin: dataAwal.jenis_kelamin === 'Putra' ? 'Putra' : 'Putri',
          no_hp: dataAwal.no_hp,
          alamat: dataAwal.alamat_rumah,
          anak_ke: dataAwal.anak_ke,
          jumlah_saudara: dataAwal.jumlah_saudara,
          asal_sekolah: dataAwal.asal_sekolah,
          tahun_lulus: 2026, 
          alamat_sekolah: "-",
          jalur_pendaftaran: dataAwal.jalur_pendaftaran,
        }
      });

      // 2. Create ke tb_orang_tua
      await tx.tb_orang_tua.create({
        data: {
          id_siswa: siswa.id_siswa,
          nama_ayah: dataAwal.nama_ayah,
          tempat_lahir_ayah: dataAwal.tempat_lahir_ayah,
          tanggal_lahir_ayah: dataAwal.tanggal_lahir_ayah,
          pendidikan_ayah: dataAwal.pendidikan_ayah,
          pekerjaan_ayah: dataAwal.pekerjaan_ayah,
          penghasilan_ayah: dataAwal.penghasilan_ayah,
          nama_ibu: dataAwal.nama_ibu,
          tempat_lahir_ibu: dataAwal.tempat_lahir_ibu,
          tanggal_lahir_ibu: dataAwal.tanggal_lahir_ibu,
          pendidikan_ibu: dataAwal.pendidikan_ibu,
          pekerjaan_ibu: dataAwal.pekerjaan_ibu,
          penghasilan_ibu: dataAwal.penghasilan_ibu,
        }
      });

      // 3. Hapus data lama di pendaftaran
      await tx.tb_pembayaran_pendaftaran.deleteMany({ where: { id_pendaftaran: id_pendaftar } });
      await tx.tb_daftar_ulang.deleteMany({ where: { id_pendaftar: id_pendaftar } });
      await tx.tb_pendaftaran.delete({ where: { id_pendaftar } });

      return siswa;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}