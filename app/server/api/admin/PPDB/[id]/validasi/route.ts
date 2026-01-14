import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { id_pendaftar } = await req.json();

    // 1. Ambil data pendaftaran lengkap
    const pendaftaran = await prisma.tb_pendaftaran.findUnique({
      where: { id_pendaftar },
      include: { 
        tb_pembayaran_pendaftaran: true,
        tb_daftar_ulang: {
            include: { tb_pembayaran_daftar_ulang: true }
        },
        tb_prestasi_pendaftar: true 
      }
    });

    if (!pendaftaran) {
      return NextResponse.json({ error: "Data pendaftaran tidak ditemukan" }, { status: 404 });
    }

    const isAlreadyDaftarUlang = pendaftaran.tb_daftar_ulang.length > 0;

    // SKENARIO 1: MASUK TAHAP DAFTAR ULANG
    if (!isAlreadyDaftarUlang) {
      const isLunasPendaftaran = pendaftaran.tb_pembayaran_pendaftaran.some(p => p.status === 'lunas');
      
      if (!isLunasPendaftaran) {
        return NextResponse.json({ error: "Gagal: Biaya Pendaftaran belum lunas!" }, { status: 400 });
      }

      await prisma.tb_daftar_ulang.create({
        data: { id_pendaftar: pendaftaran.id_pendaftar }
      });

      return NextResponse.json({ success: true, message: "Siswa berhasil masuk tahap Daftar Ulang" });
    }

    // SKENARIO 2: JADI SISWA TETAP
    else {
      const idDaftarUlang = pendaftaran.tb_daftar_ulang[0].id_daftar_ulang;
      const pembayaranDU = pendaftaran.tb_daftar_ulang[0].tb_pembayaran_daftar_ulang;
      const hasPayment = pembayaranDU.some(p => p.status === 'lunas' || p.status === 'cicil');

      if (!hasPayment) {
        return NextResponse.json({ error: "Gagal: Belum ada pembayaran Daftar Ulang" }, { status: 400 });
      }

      const nisnSiswa = pendaftaran.nisn.substring(0, 10);
      const existingSiswa = await prisma.tb_siswa.findUnique({
        where: { NISN: nisnSiswa }
      });

      if (existingSiswa) {
        return NextResponse.json({ error: "Siswa sudah terdaftar." }, { status: 400 });
      }

      // --- PERBAIKAN LOGIC GENDER (SOLUSI ERROR TS) ---
      // Konversi ke String() agar TypeScript mengizinkan perbandingan dengan string biasa
      let genderFixed = String(pendaftaran.jenis_kelamin); 
      
      if (genderFixed === "Laki-laki" || genderFixed === "Laki laki") {
          genderFixed = "Laki_laki"; // Format Enum yang diterima Prisma Schema tb_siswa
      }
      // -----------------------------------------------

      const result = await prisma.$transaction(async (tx) => {
        
        // A. Create Siswa
        const siswa = await tx.tb_siswa.create({
          data: {
            NISN: nisnSiswa,
            nama_lengkap: pendaftaran.nama_lengkap,
            email: pendaftaran.email,
            tipe_siswa: pendaftaran.tipe_siswa === 'bantuan' ? 'bantuan' : 'reguler',
            jalur_pendaftaran: pendaftaran.jalur_pendaftaran as any, 
            tempat_lahir: pendaftaran.tempat_lahir,
            tanggal_lahir: pendaftaran.tanggal_lahir,
            
            // GUNAKAN VARIABEL YANG SUDAH DI-FIX DAN DI-CAST 'any'
            jenis_kelamin: genderFixed as any,
            
            ukuran_baju: pendaftaran.ukuran_baju as any,
            no_hp: pendaftaran.no_hp,
            alamat: pendaftaran.alamat_rumah, 
            rt: pendaftaran.rt,
            rw: pendaftaran.rw,
            kode_pos: pendaftaran.kode_pos,
            anak_ke: pendaftaran.anak_ke,
            jumlah_saudara: pendaftaran.jumlah_saudara,
            asal_sekolah: pendaftaran.asal_sekolah,
            tahun_lulus: pendaftaran.tahun_lulus || new Date().getFullYear(),
            alamat_sekolah: pendaftaran.alamat_sekolah || "-",
            kode_pos_sekolah: pendaftaran.kode_pos_sekolah ? parseInt(pendaftaran.kode_pos_sekolah) : null,
            status_pembayaran: "belum_lunas",
            
            jumlah_hafalan: pendaftaran.jumlah_hafalan,
          }
        });

        // B. Create Ortu
        await tx.tb_orang_tua.create({
          data: {
            id_siswa: siswa.id_siswa,
            nama_ayah: pendaftaran.nama_ayah,
            tempat_lahir_ayah: pendaftaran.tempat_lahir_ayah,
            tanggal_lahir_ayah: pendaftaran.tanggal_lahir_ayah,
            pendidikan_ayah: pendaftaran.pendidikan_ayah,
            pekerjaan_ayah: pendaftaran.pekerjaan_ayah,
            penghasilan_ayah: pendaftaran.penghasilan_ayah,
            nama_ibu: pendaftaran.nama_ibu,
            tempat_lahir_ibu: pendaftaran.tempat_lahir_ibu,
            tanggal_lahir_ibu: pendaftaran.tanggal_lahir_ibu,
            pendidikan_ibu: pendaftaran.pendidikan_ibu,
            pekerjaan_ibu: pendaftaran.pekerjaan_ibu,
            penghasilan_ibu: pendaftaran.penghasilan_ibu,
            no_hp_orang_tua: pendaftaran.no_hp_orang_tua
          }
        });

        // C. Copy Prestasi
        if (pendaftaran.tb_prestasi_pendaftar && pendaftaran.tb_prestasi_pendaftar.length > 0) {
            await Promise.all(pendaftaran.tb_prestasi_pendaftar.map(async (p) => {
                return tx.tb_prestasi.create({
                    data: {
                        id_siswa: siswa.id_siswa,
                        nama_prestasi: p.nama_prestasi,
                        jenis_prestasi: p.jenis_prestasi as any, 
                        tingkat: p.tingkat as any,
                        peringkat: p.peringkat,
                        tahun: p.tahun || new Date().getFullYear(),
                        penyelenggara: p.penyelenggara
                    }
                });
            }));
        }

        // D. Update Pembayaran
        await tx.tb_pembayaran_daftar_ulang.updateMany({
          where: { id_daftar_ulang: idDaftarUlang },
          data: { id_siswa: siswa.id_siswa }
        });

        // E. Update Status
        await tx.tb_pendaftaran.update({
            where: { id_pendaftar: pendaftaran.id_pendaftar },
            data: { status_seleksi: 'diterima' }
        });
        
        return siswa;
      });

      return NextResponse.json({ success: true, message: "Siswa resmi divalidasi", data: result });
    }

  } catch (error: any) {
    console.error("Validation Error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}