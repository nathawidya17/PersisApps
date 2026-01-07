import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params; 
    
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const idAngka = parseInt(id);
    const isIdMurni = !isNaN(idAngka) && !id.startsWith('0');

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

    // --- LOGIKA STATUS PEMBAYARAN ---
    // Mengambil data dari tb_pembayaran_pendaftaran yang sudah di-include di atas
    const dataBayar = detail.tb_pembayaran_pendaftaran[0];
    let label_status_pembayaran = "Belum Bayar";

    // Ganti logika pengecekan di route.ts (GET) Anda menjadi seperti ini:
if (dataBayar) {
  const currentStatus = dataBayar.status as string; // Paksa menjadi string untuk perbandingan aman

  if (currentStatus === "menunggu") {
    label_status_pembayaran = "Menunggu Verifikasi";
  } else if (currentStatus === "lunas") {
    label_status_pembayaran = "Lunas";
  } else if (currentStatus === "cicil") {
    label_status_pembayaran = "Cicil";
  } else {
    label_status_pembayaran = "Belum Lunas";
  }
}
    const status_tahap = (detail.tb_daftar_ulang?.length ?? 0) > 0 ? "Daftar Ulang" : "Pendaftaran";

    return NextResponse.json({
      detail,
      status_tahap,
      label_status_pembayaran, // Gunakan variabel ini di Frontend Anda
      jenis_pembayaran 
    });

  } catch (error: any) {
    console.error("Prisma Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}