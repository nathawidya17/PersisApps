import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterTagihanByGender } from "@/lib/validationByGender"; 

export async function POST(request: Request) {
  try {
    const { nisn } = await request.json();

    if (!nisn) {
      return NextResponse.json({ error: "NISN wajib disertakan" }, { status: 400 });
    }

    // 1. Cari data siswa, pembayaran pendaftaran, DAN data daftar ulang
    const siswa = await prisma.tb_pendaftaran.findFirst({
      where: { nisn: nisn },
      include: {
        // Cek pembayaran pendaftaran (PPDB Awal)
        tb_pembayaran_pendaftaran: {
          orderBy: { created_at: 'desc' }, 
          take: 1
        },
        // Cek apakah sudah ada data di daftar ulang
        tb_daftar_ulang: true 
      }
    });

    // --- VALIDASI 1: Apakah Data Siswa Ada? ---
    if (!siswa) {
      return NextResponse.json({ 
        error: "Data NISN tidak ditemukan. Silakan lakukan pendafatran terlebih dahulu, atau jika sudah melakukan pendafatran tunggu admin untuk melakukan verifikasi pembayaran." 
      }, { status: 404 });
    }

    // --- VALIDASI 2: Apakah SUDAH Daftar Ulang? (LOGIKA BARU) ---
    // Jika array tb_daftar_ulang tidak kosong, berarti sudah pernah submit
    if (siswa.tb_daftar_ulang && siswa.tb_daftar_ulang.length > 0) {
      return NextResponse.json({ 
        error: "Anda sudah melakukan proses daftar ulang sebelumnya. Silahkan pergi ke halaman cek tagihan untuk melihat status pembayaran daftar ulang Anda." 
      }, { status: 403 });
    }

    // --- VALIDASI 3: Cek Status Pembayaran Pendaftaran ---
    const pembayaranTerakhir = siswa.tb_pembayaran_pendaftaran[0];

    // Jika belum pernah bayar pendaftaran awal
    if (!pembayaranTerakhir) {
      return NextResponse.json({ 
        error: "Anda belum melakukan pembayaran pendaftaran awal. Silakan selesaikan pembayaran pendaftaran terlebih dahulu." 
      }, { status: 403 });
    }

    // Jika status masih "menunggu"
    if (pembayaranTerakhir.status === "menunggu") {
      return NextResponse.json({ 
        error: "Pembayaran pendaftaran Anda sedang diverifikasi oleh Admin. Mohon tunggu hingga proses pembayaran telah dikonfirmasi oleh admin." 
      }, { status: 403 }); 
    }

    // Jika status "belum" atau "cicil" (Belum Lunas)
    if (pembayaranTerakhir.status !== "lunas") {
        return NextResponse.json({ 
          error: `Status pembayaran pendaftaran Anda saat ini: ${pembayaranTerakhir.status}. Harap lunasi pembayaran pendaftaran untuk melanjutkan.` 
        }, { status: 403 });
    }

    // --- JIKA LOLOS SEMUA VALIDASI ---

    // 2. Ambil tagihan Daftar Ulang
    let listTagihan = await prisma.tb_jenis_pembayaran.findMany({
        orderBy: {
            id_jenis_pembayaran: 'asc'
        }
    });

    // Filter tagihan berdasarkan gender (Seragam Putra/Putri)
    listTagihan = filterTagihanByGender(listTagihan, siswa.jenis_kelamin);

    return NextResponse.json({ 
        success: true, 
        student: siswa,
        paymentTypes: listTagihan 
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}