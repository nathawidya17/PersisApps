import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pendaftaranRaw = await prisma.tb_pendaftaran.findMany({
      where: {
        tb_daftar_ulang: { none: {} },
        status_seleksi: 'proses' // FILTER TAMBAHAN
      },
      orderBy: { created_at: 'desc' }
    });

    const daftarUlangRaw = await prisma.tb_daftar_ulang.findMany({
      where: {
        tb_pendaftaran: {
            status_seleksi: 'proses' // FILTER TAMBAHAN VIA RELASI
        }
      },
      include: {
        tb_pendaftaran: true,
        tb_pembayaran_daftar_ulang: {
            orderBy: { created_at: 'desc' },
            take: 1
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const dataPendaftaran = pendaftaranRaw.map((item) => ({
      id: item.id_pendaftar,
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
    const dataDaftarUlang = daftarUlangRaw.map((item) => {
        const infoBayar = item.tb_pembayaran_daftar_ulang[0];
        const statusBayar = infoBayar ? infoBayar.status : 'belum';

        let statusLabel = "Daftar Ulang"; 
        
        // Logika label status untuk UI
        if (statusBayar === 'lunas') {
            statusLabel = "Daftar Ulang";
        } else if (statusBayar === 'menunggu') {
            statusLabel = "Verifikasi Pembayaran"; // Sedikit saya perjelas
        } else {
            statusLabel = "Daftar Ulang (Belum Bayar)";
        }

        return {
            id: item.tb_pendaftaran.id_pendaftar, // Tetap gunakan ID Pendaftar agar link detail benar
            NISN: item.tb_pendaftaran.nisn,
            nama_lengkap: item.tb_pendaftaran.nama_lengkap,
            jenis_kelamin: item.tb_pendaftaran.jenis_kelamin,
            tempat_lahir: item.tb_pendaftaran.tempat_lahir,
            tanggal_lahir: new Date(item.tb_pendaftaran.tanggal_lahir).toLocaleDateString("id-ID", {
                day: "2-digit", month: "short", year: "numeric",
            }),
            status: statusLabel,
            jalur: item.tb_pendaftaran.jalur_pendaftaran,
            updated_at: new Date(item.created_at).toLocaleString("id-ID", {
                day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
            }),
        };
    });

    // Gabungkan data
    return NextResponse.json([...dataDaftarUlang, ...dataPendaftaran]);

  } catch (error: any) {
    console.error("API PPDB ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}