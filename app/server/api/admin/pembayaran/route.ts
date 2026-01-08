import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Ambil data pendaftaran (Di schema kamu model ini tidak ada relasi ke tb_jenis_pembayaran)
    const pendaftaran = await prisma.tb_pembayaran_pendaftaran.findMany({
      where: {
        OR: [{ status: "belum" }, { status: "menunggu" }]
      },
      include: { 
        tb_pendaftaran: true 
      }
    });

    // 2. Ambil data daftar ulang (Model ini ADA relasi ke tb_jenis_pembayaran)
    const daftarUlang = await prisma.tb_pembayaran_daftar_ulang.findMany({
      where: {
        OR: [{ status: "belum" }, { status: "menunggu" }]
      },
      include: { 
        tb_siswa: true,
        tb_jenis_pembayaran: true 
      }
    });

    const combinedData = [
      ...pendaftaran.map((p: any) => ({
        id: p.id_bayar_pendaftaran,
        type: "Pendaftaran",
        NISN: p.tb_pendaftaran?.nisn || "-",
        nama_siswa: p.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        tagihan: "Biaya Pendaftaran",
        // Untuk pendaftaran, karena tidak ada relasi, kita buat manual harga dasarnya 200000
        nominal_tagihan: 199000, 
        nominal: p.nominal,
        status: "Need Approval",
        bukti_pembayaran: p.bukti_pembayaran,
        tanggal_pembayaran: p.tanggal_bayar 
          ? `${p.tanggal_bayar.toISOString().split('T')[0]} ${p.tanggal_bayar.toTimeString().split(' ')[0].slice(0, 5)}` 
          : "-",
      })),
      ...daftarUlang.map((d: any) => ({
        id: d.id_pembayaran_daftar_ulang,
        type: "DaftarUlang",
        NISN: d.tb_siswa?.NISN || "-",
        nama_siswa: d.tb_siswa?.nama_lengkap || "Siswa Tidak Ditemukan",
        tagihan: d.tb_jenis_pembayaran?.nama_pembayaran || "Daftar Ulang",
        // Ambil nominal asli dari master data tb_jenis_pembayaran
        nominal_tagihan: d.tb_jenis_pembayaran?.nominal || 0,
        nominal: d.nominal,
        status: "Need Approval",
        bukti_pembayaran: d.bukti_pembayaran,
        tanggal_pembayaran: d.tanggal_bayar 
          ? `${d.tanggal_bayar.toISOString().split('T')[0]} ${d.tanggal_bayar.toTimeString().split(' ')[0].slice(0, 5)}` 
          : "-",
      }))
    ];

    return NextResponse.json(combinedData);
  } catch (error: any) {
    console.error("ERROR PEMBAYARAN:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH tetap sama...

// ... Fungsi PATCH tetap sama

export async function PATCH(request: Request) {
  try {
    const { id, type, status, id_user_admin } = await request.json();
    
    // 1. Cari nama asli admin di tb_users berdasarkan ID yang sedang login
    let adminRealName = "System Admin";
    if (id_user_admin) {
      const adminData = await prisma.tb_users.findUnique({
        where: { id_user: Number(id_user_admin) },
        select: { nama: true }
      });
      if (adminData) adminRealName = adminData.nama;
    }

    const targetStatus = status === "Approved" ? "lunas" : "belum";

    // 2. Simpan status DAN nama asli admin ke database
    if (type === "Pendaftaran") {
      await prisma.tb_pembayaran_pendaftaran.update({
        where: { id_bayar_pendaftaran: Number(id) },
        data: { 
          status: targetStatus,
          // Simpan nama asli (contoh: "natha") ke kolom approved_by
          approved_by: status === "Approved" ? adminRealName : null 
        }
      });
    } else {
      await prisma.tb_pembayaran_daftar_ulang.update({
        where: { id_pembayaran_daftar_ulang: Number(id) },
        data: { 
          status: targetStatus,
          approved_by: status === "Approved" ? adminRealName : null 
        }
      });
    }

    return NextResponse.json({ message: "Disetujui oleh " + adminRealName });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}