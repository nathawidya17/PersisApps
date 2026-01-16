import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterTagihanByGender } from "@/lib/validationByGender";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { nisn } = await req.json();

    // 1. Cari Data Siswa (Cek di TB_SISWA dulu)
    const siswa = await prisma.tb_siswa.findUnique({
      where: { NISN: nisn },
      include: {
        tb_pembayaran_daftar_ulang: true 
      }
    });

    let dataSiswa = null;
    let riwayatBayarDaftarUlang: any[] = [];
    let riwayatBayarPendaftaran: any[] = []; 

    if (siswa) {
      // === KONDISI A: SUDAH JADI SISWA TETAP ===
      dataSiswa = {
        id: siswa.id_siswa,
        nama: siswa.nama_lengkap,
        nisn: siswa.NISN,
        email: siswa.email,
        nik: siswa.nik,
        no_kk: siswa.no_kk,
        tempat_lahir: siswa.tempat_lahir,
        tanggal_lahir: siswa.tanggal_lahir,
        jenis_kelamin: siswa.jenis_kelamin,
        anak_ke: siswa.anak_ke,
        jumlah_saudara: siswa.jumlah_saudara,
        jalur_pendaftaran: siswa.jalur_pendaftaran,
        no_hp: siswa.no_hp,
        ukuran_baju: siswa.ukuran_baju,
        alamat_rumah: siswa.alamat, 
        rt: siswa.rt,
        rw: siswa.rw,
        asal_sekolah: siswa.asal_sekolah,
        tahun_lulus: siswa.tahun_lulus,
        alamat_sekolah: siswa.alamat_sekolah,
        status_siswa: siswa.tipe_siswa 
      };
      riwayatBayarDaftarUlang = siswa.tb_pembayaran_daftar_ulang;
      
      // Ambil history pendaftaran dari tabel pendaftaran lama
      const pendaftaranLama = await prisma.tb_pendaftaran.findFirst({
          where: { nisn: nisn },
          include: { tb_pembayaran_pendaftaran: true }
      });
      
      if (pendaftaranLama) {
          riwayatBayarPendaftaran = pendaftaranLama.tb_pembayaran_pendaftaran;
      }

    } else {
      // === KONDISI B: MASIH CALON SISWA / PENDAFTAR ===
      const pendaftar = await prisma.tb_pendaftaran.findFirst({
        where: { nisn: nisn },
        include: {
            tb_pembayaran_pendaftaran: true,
            tb_daftar_ulang: {
                include: { tb_pembayaran_daftar_ulang: true }
            }
        }
      });

      if (!pendaftar) {
        return NextResponse.json({ error: "NISN tidak ditemukan." }, { status: 404 });
      }

      dataSiswa = {
        id: pendaftar.id_pendaftar,
        nama: pendaftar.nama_lengkap,
        nisn: pendaftar.nisn,
        email: pendaftar.email,
        nik: pendaftar.nik,
        no_kk: pendaftar.no_kk,
        tempat_lahir: pendaftar.tempat_lahir,
        tanggal_lahir: pendaftar.tanggal_lahir,
        jenis_kelamin: pendaftar.jenis_kelamin,
        anak_ke: pendaftar.anak_ke,
        jumlah_saudara: pendaftar.jumlah_saudara,
        jalur_pendaftaran: pendaftar.jalur_pendaftaran,
        no_hp: pendaftar.no_hp,
        ukuran_baju: pendaftar.ukuran_baju,
        alamat_rumah: pendaftar.alamat_rumah,
        rt: pendaftar.rt,
        rw: pendaftar.rw,
        asal_sekolah: pendaftar.asal_sekolah,
        tahun_lulus: pendaftar.tahun_lulus,
        alamat_sekolah: pendaftar.alamat_sekolah,
        status_siswa: pendaftar.tipe_siswa || 'reguler'
      };
      
      riwayatBayarPendaftaran = pendaftar.tb_pembayaran_pendaftaran;
      if (pendaftar.tb_daftar_ulang.length > 0) {
          riwayatBayarDaftarUlang = pendaftar.tb_daftar_ulang[0].tb_pembayaran_daftar_ulang;
      }
    }

    // 2. Ambil Jenis Tagihan Aktif & Filter Gender
    let jenisTagihan = await prisma.tb_jenis_pembayaran.findMany({ where: { status: 'aktif' } });
    jenisTagihan = filterTagihanByGender(jenisTagihan, dataSiswa.jenis_kelamin);

    // 3. Hitung Kalkulasi Terbayar (DENGAN LOGIC FIX BUG)
    const listTagihan = jenisTagihan.map((jt) => {
        const nominalTagihan = Number(jt.nominal);
        const namaTagihan = jt.nama_pembayaran.toLowerCase().trim();
        
        let sumNominalDB = 0;
        let payments = [];

        // A. Tentukan sumber data pembayaran (Pendaftaran vs Daftar Ulang)
        if (namaTagihan.includes("pendaftaran")) {
             payments = riwayatBayarPendaftaran.filter((p) => 
                ['lunas', 'cicil', 'belum', 'menunggu'].includes(p.status)
             );
        } else {
             payments = riwayatBayarDaftarUlang.filter((p) => 
                p.id_jenis_pembayaran === jt.id_jenis_pembayaran && 
                ['lunas', 'cicil', 'belum', 'menunggu'].includes(p.status)
             );
        }

        // B. Hitung Total Uang Masuk dari DB
        sumNominalDB = payments.reduce((acc, curr) => acc + Number(curr.nominal), 0);

        // C. === LOGIC ANTI-BUG (INTERCEPTOR) ===
        // Masalah: Item 50rb tertulis 500rb di DB karena bug bulk payment.
        // Solusi: Jika total di DB jauh lebih besar (>110%) dari harga asli, PAKSA pakai harga asli.
        let terbayar = sumNominalDB;

        if (sumNominalDB > nominalTagihan * 1.1) {
            terbayar = nominalTagihan; // Reset jadi harga normal (misal 50.000)
        }

        // D. === LOGIC FIX PENDAFTARAN 199RB ===
        // Jika ini tagihan pendaftaran, dan uang masuk sudah >= 199.000, anggap LUNAS (Full)
        if (namaTagihan.includes("pendaftaran")) {
            if (terbayar >= 199000) {
                terbayar = nominalTagihan; // Paksa sama dengan target agar sisa 0 (Lunas)
            }
        }

        const sisa = Math.max(0, nominalTagihan - terbayar);

        return {
            id: jt.id_jenis_pembayaran,
            nama: jt.nama_pembayaran,
            total_tagihan: nominalTagihan,
            terbayar: terbayar, // <--- Ini angka yang sudah dibersihkan
            sisa: sisa,
            status: sisa <= 0 ? 'Lunas' : 'Belum Lunas'
        };
    });

    // 4. Ringkasan Global
    const totalSemua = listTagihan.reduce((acc, curr) => acc + curr.total_tagihan, 0);
    const terbayarSemua = listTagihan.reduce((acc, curr) => acc + curr.terbayar, 0);

    return NextResponse.json({
      siswa: dataSiswa,
      tagihan: listTagihan,
      ringkasan: {
        total: totalSemua,
        terbayar: terbayarSemua,
        sisa: totalSemua - terbayarSemua
      }
    });

  } catch (error) {
    console.error("Error API Cek Tagihan:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}