import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. AMBIL DATA SISWA & PEMBAYARAN DAFTAR ULANG (Relasi Langsung)
    const dataSiswa = await prisma.tb_siswa.findMany({
      include: {
        tb_orang_tua: true,
        tb_prestasi: true,
        tb_pembayaran_daftar_ulang: {
            include: { tb_jenis_pembayaran: true },
            where: { status: { in: ['lunas', 'cicil'] } }
        }
      },
      orderBy: { nama_lengkap: 'asc' }
    });

    // 2. [FIX] AMBIL DATA PEMBAYARAN PENDAFTARAN (Relasi via NISN)
    // Karena di schema tb_siswa tidak ada relasi langsung ke tb_pembayaran_pendaftaran
    const nisnList = dataSiswa.map(s => s.NISN);
    
    const pembayaranPendaftaran = await prisma.tb_pembayaran_pendaftaran.findMany({
        where: {
            tb_pendaftaran: {
                nisn: { in: nisnList } // Cari berdasarkan NISN siswa yang ada
            },
            status: { in: ['lunas', 'cicil'] } // Ambil Lunas & Cicil
        },
        include: {
            tb_pendaftaran: {
                select: { nisn: true } // Ambil NISN buat pencocokan nanti
            }
        }
    });

    // 3. SUSUN DATA
    const listSiswa: any[] = [];
    const listOrtu: any[] = [];
    const listPrestasi: any[] = [];
    const listPembayaran: any[] = [];

    dataSiswa.forEach((siswa) => {
        // --- DATA SISWA ---
        listSiswa.push({
            "NISN": siswa.NISN,
            "Nama Lengkap": siswa.nama_lengkap,
            "NIK": siswa.nik,
            "No KK": siswa.no_kk,
            "JK": siswa.jenis_kelamin,
            "TTL": `${siswa.tempat_lahir}, ${siswa.tanggal_lahir ? new Date(siswa.tanggal_lahir).toLocaleDateString('id-ID') : '-'}`,
            "Alamat": `${siswa.alamat}, RT ${siswa.rt || '-'}/RW ${siswa.rw || '-'}`,
            "Kode Pos": siswa.kode_pos || '-',
            "No HP Siswa": siswa.no_hp,
            "Email": siswa.email || '-',
            "Ukuran Baju": siswa.ukuran_baju || '-',
            "Asal Sekolah": siswa.asal_sekolah,
            "Tahun Lulus": siswa.tahun_lulus || '-',
            "Tipe Siswa": siswa.tipe_siswa,
            "Jalur": siswa.jalur_pendaftaran,
            "Status Bayar": siswa.status_pembayaran === 'lunas' ? 'Lunas' : 'Belum Lunas'
        });

        // --- DATA ORANG TUA ---
        if (siswa.tb_orang_tua.length > 0) {
            siswa.tb_orang_tua.forEach(ortu => {
                const formatTTL = (tpt: string, tgl: Date) => `${tpt}, ${tgl ? new Date(tgl).toLocaleDateString('id-ID') : '-'}`;
                listOrtu.push({
                    "Siswa Terkait": siswa.nama_lengkap,
                    "Nama Ayah": ortu.nama_ayah,
                    "TTL Ayah": formatTTL(ortu.tempat_lahir_ayah, ortu.tanggal_lahir_ayah),
                    "Pekerjaan Ayah": ortu.pekerjaan_ayah,
                    "Penghasilan Ayah": ortu.penghasilan_ayah,
                    "No HP Ortu": ortu.no_hp_orang_tua || '-',
                    "Nama Ibu": ortu.nama_ibu,
                    "TTL Ibu": formatTTL(ortu.tempat_lahir_ibu, ortu.tanggal_lahir_ibu),
                    "Pekerjaan Ibu": ortu.pekerjaan_ibu,
                    "Penghasilan Ibu": ortu.penghasilan_ibu
                });
            });
        } else {
            listOrtu.push({
                "Siswa Terkait": siswa.nama_lengkap, "Nama Ayah": "-", "No HP Ortu": "-", "Nama Ibu": "-"
            });
        }

        // --- DATA PRESTASI ---
        if (siswa.tb_prestasi.length > 0) {
            siswa.tb_prestasi.forEach(p => {
                listPrestasi.push({
                    "Siswa Terkait": siswa.nama_lengkap,
                    "Nama Prestasi": p.nama_prestasi,
                    "Jenis": p.jenis_prestasi,
                    "Tingkat": p.tingkat,
                    "Peringkat": p.peringkat || '-',
                    "Tahun": p.tahun,
                    "Penyelenggara": p.penyelenggara || '-'
                });
            });
        }

        // --- [FIX] DATA PEMBAYARAN (GABUNGAN PENDAFTARAN & DAFTAR ULANG) ---
        
        // A. Cari Pembayaran Pendaftaran milik siswa ini (Match by NISN)
        const bayarPend = pembayaranPendaftaran.find(p => p.tb_pendaftaran.nisn === siswa.NISN);
        if (bayarPend) {
             listPembayaran.push({
                "Siswa Terkait": siswa.nama_lengkap,
                "Nama Tagihan": "Biaya Formulir Pendaftaran",
                "Nominal": bayarPend.nominal,
                "Metode": bayarPend.metode_pembayaran,
                "Status": bayarPend.status, // Ini status (cicil/lunas) akan muncul
                "Tanggal Bayar": bayarPend.created_at ? new Date(bayarPend.created_at).toLocaleDateString('id-ID') : '-'
            });
        }

        // B. Masukkan Pembayaran Daftar Ulang (Yang sudah ada relasinya)
        if (siswa.tb_pembayaran_daftar_ulang.length > 0) {
            siswa.tb_pembayaran_daftar_ulang.forEach(trx => {
                listPembayaran.push({
                    "Siswa Terkait": siswa.nama_lengkap,
                    "Nama Tagihan": trx.tb_jenis_pembayaran?.nama_pembayaran || "Tagihan",
                    "Nominal": trx.nominal,
                    "Metode": trx.metode_pembayaran,
                    "Status": trx.status,
                    "Tanggal Bayar": trx.tanggal_bayar ? new Date(trx.tanggal_bayar).toLocaleDateString('id-ID') : '-'
                });
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
    console.error("API DAFTAR SISWA EXPORT ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}