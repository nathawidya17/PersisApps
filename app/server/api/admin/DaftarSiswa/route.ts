import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"; // Ganti dengan library DB yang kamu pakai

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Ambil data dari tb_siswa
    const siswa = await prisma.tb_siswa.findMany({
      orderBy: {
        updated_at: 'desc', // Urutkan dari yang terbaru
      },
    });

    return NextResponse.json(siswa);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ message: "Gagal mengambil data siswa" }, { status: 500 });
  }
}