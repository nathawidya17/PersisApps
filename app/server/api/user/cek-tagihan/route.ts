import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterTagihanByGender } from "@/lib/validationByGender";

export async function POST(req: Request) {
  try {
    const { nisn } = await req.json();

    // 1. Cari Data Siswa
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
        tempat_lahir: siswa.tempat_lahir,
        tanggal_lahir: siswa.tanggal_lahir,
        jenis_kelamin: siswa.jenis_kelamin,
        anak_ke: siswa.anak_ke,
        jumlah_saudara: siswa.jumlah_saudara,
        jalur_pendaftaran: siswa.jalur_pendaftaran,
        no_hp: siswa.no_hp,
        ukuran_baju: siswa.ukuran_baju,
        alamat_rumah: siswa.alamat, 
        asal_sekolah: siswa.asal_sekolah,
        tahun_lulus: siswa.tahun_lulus,
        alamat_sekolah: siswa.alamat_sekolah,
        status_siswa: siswa.tipe_siswa 
      };
      riwayatBayarDaftarUlang = siswa.tb_pembayaran_daftar_ulang;
      
      // FIX KUNCI: Cari history pendaftaran lama berdasarkan NISN asli
      // Pastikan field 'nisn' di tb_pendaftaran sesuai dengan NISN di tb_siswa
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
        tempat_lahir: pendaftar.tempat_lahir,
        tanggal_lahir: pendaftar.tanggal_lahir,
        jenis_kelamin: pendaftar.jenis_kelamin,
        anak_ke: pendaftar.anak_ke,
        jumlah_saudara: pendaftar.jumlah_saudara,
        jalur_pendaftaran: pendaftar.jalur_pendaftaran,
        no_hp: pendaftar.no_hp,
        ukuran_baju: pendaftar.ukuran_baju,
        alamat_rumah: pendaftar.alamat_rumah,
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

    // 3. Hitung Kalkulasi Terbayar (Sertakan status 'belum' agar cicilan baru tidak hilang)
    const listTagihan = jenisTagihan.map((jt) => {
        let terbayar = 0;
        const namaTagihan = jt.nama_pembayaran.toLowerCase().trim();

        if (namaTagihan.includes("pendaftaran")) {
             // Hitung dari tb_pembayaran_pendaftaran
             terbayar = riwayatBayarPendaftaran
                .filter((p) => ['lunas', 'cicil', 'belum'].includes(p.status))
                .reduce((acc, curr) => acc + Number(curr.nominal), 0);
        } else {
             // Hitung dari tb_pembayaran_daftar_ulang
             terbayar = riwayatBayarDaftarUlang
                .filter((p) => 
                    p.id_jenis_pembayaran === jt.id_jenis_pembayaran && 
                    ['lunas', 'cicil', 'belum'].includes(p.status)
                )
                .reduce((acc, curr) => acc + Number(curr.nominal), 0);
        }

        const nominalTagihan = Number(jt.nominal);
        const sisa = Math.max(0, nominalTagihan - terbayar);

        return {
            id: jt.id_jenis_pembayaran,
            nama: jt.nama_pembayaran,
            total_tagihan: nominalTagihan,
            terbayar: terbayar,
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