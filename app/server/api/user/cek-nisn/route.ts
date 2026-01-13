import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { nisn } = await request.json();

    if (!nisn) {
      return NextResponse.json({ error: "NISN wajib diisi" }, { status: 400 });
    }

    // Cari siswa berdasarkan NISN di tabel pendaftaran
    const siswa = await prisma.tb_pendaftaran.findFirst({
      where: {
        nisn: nisn,
      },
    });

    if (!siswa) {
      return NextResponse.json({ error: "Data NISN tidak ditemukan dalam sistem kami." }, { status: 404 });
    }

    // Jika ditemukan, kembalikan data (bisa diarahkan ke step selanjutnya)
    return NextResponse.json({ success: true, data: siswa }, { status: 200 });

  } catch (error) {
    console.error("Error checking NISN:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
} 