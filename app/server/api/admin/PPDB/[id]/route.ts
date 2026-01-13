import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

// === GET: Ambil Detail Siswa ===
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; 
    
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const idAngka = parseInt(id);
    const isIdMurni = !isNaN(idAngka) && !id.startsWith('0');

    // Ambil Master Jenis Pembayaran
    const jenis_pembayaran = await prisma.tb_jenis_pembayaran.findMany();

    // --- QUERY UTAMA ---
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
        },
        tb_prestasi_pendaftar: true
        // HAPUS tb_dokumen: true KARENA TIDAK ADA RELASI DI SCHEMA
      }
    });

    if (!detail) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    // --- LOGIKA STATUS PEMBAYARAN ---
    const dataBayar = detail.tb_pembayaran_pendaftaran && detail.tb_pembayaran_pendaftaran.length > 0 
      ? detail.tb_pembayaran_pendaftaran[0] 
      : null;
      
    let label_status_pembayaran = "Belum Bayar";

    if (dataBayar) {
      const currentStatus = dataBayar.status as string; 

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

    // Cek tahap pendaftaran
    const status_tahap = (detail.tb_daftar_ulang?.length ?? 0) > 0 ? "Daftar Ulang" : "Pendaftaran";

    return NextResponse.json({
      detail, 
      status_tahap,
      label_status_pembayaran,
      jenis_pembayaran 
    });

  } catch (error: any) {
    console.error("Prisma Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// === PATCH: Update Data (Contoh: Beri Keringanan) ===
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const idAngka = parseInt(id);
    if (isNaN(idAngka)) return NextResponse.json({ error: "Format ID salah" }, { status: 400 });

    if (body.action === 'keringanan') {
      await prisma.tb_pendaftaran.update({
        where: { id_pendaftar: idAngka },
        data: {
          tipe_siswa: 'bantuan'
        }
      });
      return NextResponse.json({ message: "Berhasil memberikan keringanan." });
    }

    return NextResponse.json({ error: "Action tidak dikenali" }, { status: 400 });

  } catch (error: any) {
    console.error("Patch Error:", error);
    return NextResponse.json({ error: "Gagal mengupdate data" }, { status: 500 });
  }
}

// === DELETE: Hapus Siswa ===
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    const idAngka = parseInt(id);

    // Cek keberadaan data
    const existing = await prisma.tb_pendaftaran.findUnique({
      where: { id_pendaftar: idAngka },
      include: { tb_daftar_ulang: true }
    });

    if (!existing) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      
      // 1. Hapus Pembayaran Pendaftaran
      await tx.tb_pembayaran_pendaftaran.deleteMany({
        where: { id_pendaftaran: idAngka }
      });

      // 2. Hapus Pembayaran Daftar Ulang & Daftar Ulang (jika ada)
      const daftarUlangIds = existing.tb_daftar_ulang.map(d => d.id_daftar_ulang);
      
      if (daftarUlangIds.length > 0) {
        await tx.tb_pembayaran_daftar_ulang.deleteMany({
          where: { id_daftar_ulang: { in: daftarUlangIds } }
        });

        await tx.tb_daftar_ulang.deleteMany({
          where: { id_pendaftar: idAngka }
        });
      }

      // 3. Hapus Prestasi
      await tx.tb_prestasi_pendaftar.deleteMany({
        where: { id_pendaftar: idAngka }
      });

      // CATATAN: Dokumen tidak dihapus di sini karena tb_dokumen tidak memiliki id_pendaftar di schema Anda.
      
      // 4. Akhirnya Hapus Pendaftar
      await tx.tb_pendaftaran.delete({
        where: { id_pendaftar: idAngka }
      });
    });

    return NextResponse.json({ message: "Data siswa berhasil dihapus permanen." });

  } catch (error: any) {
    console.error("Delete Error:", error);
    if (error.code === 'P2003') {
       return NextResponse.json({ error: "Gagal hapus: Data masih terikat dengan data lain (FK Constraint)." }, { status: 400 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan saat menghapus data" }, { status: 500 });
  }
}