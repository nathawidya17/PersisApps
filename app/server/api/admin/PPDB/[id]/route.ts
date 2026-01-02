import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params; 
    
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const idAngka = parseInt(id);
    const isIdMurni = !isNaN(idAngka) && !id.startsWith('0');

    // Ambil data master jenis pembayaran dari database
    const jenis_pembayaran = await prisma.tb_jenis_pembayaran.findMany();

    const detail = await prisma.tb_pendaftaran.findFirst({
      where: {
        OR: [
          ...(isIdMurni ? [{ id_pendaftar: idAngka }] : []),
          { nisn: id } 
        ]
      },
      include: {
        tb_pembayaran_pendaftaran: true,
        tb_daftar_ulang: {
          include: {
            tb_pembayaran_daftar_ulang: true
          }
        }
      }
    });

    if (!detail) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    const status_tahap = (detail.tb_daftar_ulang?.length ?? 0) > 0 ? "Daftar Ulang" : "Pendaftaran";

    // Kirim jenis_pembayaran ke frontend
    return NextResponse.json({
      detail,
      status_tahap,
      jenis_pembayaran 
    });

  } catch (error: any) {
    console.error("Prisma Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}