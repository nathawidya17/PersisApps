import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Ambil Siswa di Tahap Pendaftaran 
    // (Siswa yang ada di tb_pendaftaran tapi BELUM ada di tb_daftar_ulang)
    const pendaftaranRaw = await prisma.tb_pendaftaran.findMany({
      where: {
        tb_daftar_ulang: { none: {} } 
      },
      orderBy: { updated_at: 'desc' }
    });

    // 2. Ambil Siswa di Tahap Daftar Ulang
    // (Siswa yang sudah masuk ke tb_daftar_ulang tapi belum di-approve menjadi tb_siswa)
    const daftarUlangRaw = await prisma.tb_daftar_ulang.findMany({
      include: {
        tb_pendaftaran: true
      },
      where: {
        status_validasi: "menunggu" // Hanya yang belum di-approve admin
      },
      orderBy: { created_at: 'desc' }
    });

    // 3. Mapping Data Pendaftaran
    const dataPendaftaran = pendaftaranRaw.map((item) => ({
      NISN: item.nisn,
      nama_lengkap: item.nama_lengkap,
      jenis_kelamin: item.jenis_kelamin,
      tempat_lahir: item.tempat_lahir,
      tanggal_lahir: new Date(item.tanggal_lahir).toLocaleDateString("id-ID", {
        day: "2-digit", month: "short", year: "numeric",
      }),
      status: "Pendaftaran",
      jalur: item.jalur_pendaftaran,
      updated_at: new Date(item.updated_at).toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      }),
    }));

    // 4. Mapping Data Daftar Ulang
    const dataDaftarUlang = daftarUlangRaw.map((item) => ({
      NISN: item.tb_pendaftaran.nisn,
      nama_lengkap: item.tb_pendaftaran.nama_lengkap,
      jenis_kelamin: item.tb_pendaftaran.jenis_kelamin,
      tempat_lahir: item.tb_pendaftaran.tempat_lahir,
      tanggal_lahir: new Date(item.tb_pendaftaran.tanggal_lahir).toLocaleDateString("id-ID", {
        day: "2-digit", month: "short", year: "numeric",
      }),
      status: "Daftar Ulang",
      jalur: item.tb_pendaftaran.jalur_pendaftaran,
      updated_at: new Date(item.created_at).toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      }),
    }));

    // Gabungkan: Daftar Ulang di atas, Pendaftaran di bawah
    return NextResponse.json([...dataDaftarUlang, ...dataPendaftaran]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}