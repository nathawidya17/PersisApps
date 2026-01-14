import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. METHOD PUT (Tetap sama)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await req.json();

    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const updatedData = await prisma.tb_jenis_pembayaran.update({
      where: { id_jenis_pembayaran: id },
      data: {
        nama_pembayaran: body.nama_pembayaran,
        nominal: body.nominal ? parseInt(body.nominal) : undefined,
        status: body.status,
      }
    });

    return NextResponse.json({ message: "Update berhasil", data: updatedData });

  } catch (error: any) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: error.message || "Gagal update data" }, { status: 500 });
  }
}

// 2. METHOD DELETE (PERBAIKAN DISINI)
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

    // --- MENANGANI ERROR FOREIGN KEY (P2003) ---
    if (error.code === 'P2003') {
        return NextResponse.json({ 
            error: "Gagal hapus! Tagihan ini sudah memiliki riwayat transaksi pembayaran. Silakan ubah status menjadi Non-Aktif saja." 
        }, { status: 400 }); // Gunakan status 400 (Bad Request)
    }

    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}