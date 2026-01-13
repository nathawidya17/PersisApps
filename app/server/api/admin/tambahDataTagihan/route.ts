import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Ambil data, urutkan berdasarkan created_at terbaru
export async function GET() {
  try {
    const data = await prisma.tb_jenis_pembayaran.findMany({
      orderBy: { 
        created_at: 'desc' // Sekarang ini aman digunakan karena DB sudah di-push
      }
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

// POST: Tambah Data
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama_pembayaran, nominal, status } = body;

    const newData = await prisma.tb_jenis_pembayaran.create({
      data: {
        nama_pembayaran,
        nominal: parseInt(nominal),
        // Asumsi status di DB string 'aktif'/'non_aktif'
        status: status ? "aktif" : "non_aktif", 
        
        // created_at tidak perlu ditulis manual di sini, 
        // karena sudah di-handle oleh @default(now()) di schema.prisma
        // updated_at juga otomatis di-handle oleh @updatedAt
      }
    });

    return NextResponse.json({ message: "Berhasil disimpan", data: newData }, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}