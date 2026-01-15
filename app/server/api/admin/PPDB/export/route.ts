import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dataSiswa = await prisma.tb_pendaftaran.findMany({
      where: { status_seleksi: 'proses' },
      include: {
        tb_pembayaran_pendaftaran: true,
        tb_daftar_ulang: {
            include: {
                tb_pembayaran_daftar_ulang: {
                    include: { tb_jenis_pembayaran: true }
                }
            }
        },
        tb_prestasi_pendaftar: true
      },
      orderBy: { created_at: 'desc' }
    });

    const listSiswa: any[] = [];
    const listOrtu: any[] = [];
    const listPrestasi: any[] = [];
    const listPembayaran: any[] = [];

    dataSiswa.forEach((siswa) => {
        // --- 1. DATA SISWA LENGKAP ---
        listSiswa.push({
            "NISN": siswa.nisn,
            "Nama Lengkap": siswa.nama_lengkap,
            "NIK": siswa.nik,
            "No KK": siswa.no_kk, // New
            "JK": siswa.jenis_kelamin,
            "TTL": `${siswa.tempat_lahir}, ${siswa.tanggal_lahir ? new Date(siswa.tanggal_lahir).toLocaleDateString('id-ID') : '-'}`,
            "Alamat": `${siswa.alamat_rumah}, RT ${siswa.rt}/RW ${siswa.rw}`, // Updated
            "Kode Pos": siswa.kode_pos || '-', // New
            "Ukuran Baju": siswa.ukuran_baju || '-', // New
            "Asal Sekolah": siswa.asal_sekolah,
            "Kode Pos Sekolah": siswa.kode_pos_sekolah || '-', // New
            "No HP": siswa.no_hp,
            "Jalur": siswa.jalur_pendaftaran
        });

        // --- 2. DATA ORANG TUA LENGKAP ---
        // Helper function format TTL
        const formatTTL = (tempat: string, tgl: Date) => 
            `${tempat}, ${tgl ? new Date(tgl).toLocaleDateString('id-ID') : '-'}`;

        listOrtu.push({
            "Siswa Terkait": siswa.nama_lengkap,
            // AYAH
            "Nama Ayah": siswa.nama_ayah,
            "TTL Ayah": formatTTL(siswa.tempat_lahir_ayah, siswa.tanggal_lahir_ayah), // New
            "Pekerjaan Ayah": siswa.pekerjaan_ayah,
            "Penghasilan Ayah": siswa.penghasilan_ayah, // New
            "No HP Ayah": siswa.no_hp_orang_tua, // Shared HP field
            // IBU
            "Nama Ibu": siswa.nama_ibu,
            "TTL Ibu": formatTTL(siswa.tempat_lahir_ibu, siswa.tanggal_lahir_ibu), // New
            "Pekerjaan Ibu": siswa.pekerjaan_ibu,
            "Penghasilan Ibu": siswa.penghasilan_ibu // New
        });

        // --- 3. DATA PRESTASI ---
        if (siswa.tb_prestasi_pendaftar.length > 0) {
            siswa.tb_prestasi_pendaftar.forEach(p => {
                listPrestasi.push({
                    "Siswa Terkait": siswa.nama_lengkap,
                    "Nama Prestasi": p.nama_prestasi,
                    "Tingkat": p.tingkat,
                    "Peringkat": p.peringkat,
                    "Tahun": p.tahun,
                    "Penyelenggara": p.penyelenggara
                });
            });
        }

        // --- 4. DATA PEMBAYARAN ---
        // A. Pendaftaran
        siswa.tb_pembayaran_pendaftaran.forEach(trx => {
             if (trx.status === 'lunas' || trx.status === 'cicil') {
                listPembayaran.push({
                    "Siswa Terkait": siswa.nama_lengkap,
                    "Nama Tagihan": "Biaya Formulir Pendaftaran",
                    "Nominal": trx.nominal,
                    "Metode": trx.metode_pembayaran,
                    "Status": trx.status,
                    "Tanggal Bayar": new Date(trx.created_at).toLocaleDateString('id-ID')
                });
             }
        });
        // B. Daftar Ulang
        if (siswa.tb_daftar_ulang.length > 0) {
            siswa.tb_daftar_ulang[0].tb_pembayaran_daftar_ulang.forEach(trx => {
                 if (trx.status === 'lunas' || trx.status === 'cicil') {
                    listPembayaran.push({
                        "Siswa Terkait": siswa.nama_lengkap,
                        "Nama Tagihan": trx.tb_jenis_pembayaran?.nama_pembayaran || "Tagihan",
                        "Nominal": trx.nominal,
                        "Metode": trx.metode_pembayaran,
                        "Status": trx.status,
                        "Tanggal Bayar": new Date(trx.created_at).toLocaleDateString('id-ID')
                    });
                 }
            });
        }
    });

    return NextResponse.json({
        siswa: listSiswa,
        ortu: listOrtu,
        prestasi: listPrestasi,
        pembayaran: listPembayaran
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}