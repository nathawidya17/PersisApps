import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. METHOD PUT (Untuk Toggle Status & Edit Data)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await req.json();

    // Validasi ID
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    // Update ke Database
    const updatedData = await prisma.tb_jenis_pembayaran.update({
      where: { id_jenis_pembayaran: id },
      data: {
        nama_pembayaran: body.nama_pembayaran, // Opsional (kalau edit full)
        nominal: body.nominal ? parseInt(body.nominal) : undefined, // Opsional
        status: body.status, // Penting untuk Toggle ("aktif" / "nonaktif")
        
        // CATATAN: 
        // updated_at tidak perlu ditulis manual jika di schema.prisma sudah ada @updatedAt
        // Jika belum sinkron DB, baris ini yang bikin error 500.
      }
    });

    return NextResponse.json({ message: "Update berhasil", data: updatedData });

  } catch (error: any) {
    console.error("PUT Error:", error); // Cek terminal VS Code untuk detail error
    return NextResponse.json({ error: error.message || "Gagal update data" }, { status: 500 });
  }
}

// 2. METHOD DELETE (Untuk Hapus Data)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    await prisma.tb_jenis_pembayaran.delete({
      where: { id_jenis_pembayaran: id }
    });

    return NextResponse.json({ message: "Data berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}