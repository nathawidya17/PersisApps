import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { nisn } = await req.json();

    // 1. Cari Data Siswa (Prioritas 1: Siswa Aktif)
    const siswa = await prisma.tb_siswa.findUnique({
      where: { NISN: nisn },
      include: {
        tb_pembayaran_daftar_ulang: true // Ambil riwayat bayar (SPP, Bangunan, dll)
      }
    });

    let dataSiswa = null;
    let riwayatBayar: any[] = [];

    // Jika ketemu di tb_siswa (Sudah fix diterima)
    if (siswa) {
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
      riwayatBayar = siswa.tb_pembayaran_daftar_ulang;
    } 
    // Jika tidak, Cari di tb_pendaftaran (Masih Calon)
    else {
      const pendaftar = await prisma.tb_pendaftaran.findFirst({
        where: { nisn: nisn },
      });

      if (!pendaftar) {
        return NextResponse.json({ error: "NISN tidak ditemukan." }, { status: 404 });
      }

      if (pendaftar.status_seleksi !== 'diterima') {
        return NextResponse.json({ error: "Status siswa masih dalam proses Pendaftaran/Seleksi." }, { status: 400 });
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
      
      riwayatBayar = []; 
    }

    // 2. Ambil Semua Jenis Tagihan yang Aktif
    const jenisTagihan = await prisma.tb_jenis_pembayaran.findMany({
        where: { status: 'aktif' } 
    });

    // 3. Hitung Status Per Tagihan (Disini logika Lunas Pendaftaran bekerja)
    const listTagihan = jenisTagihan.map((jt) => {
        let terbayar = 0;
        const namaTagihan = jt.nama_pembayaran.toLowerCase().trim();

        // --- LOGIC WAJIB: Pendaftaran AUTO LUNAS ---
        // Jika nama tagihan mengandung kata "pendaftaran", anggap sudah lunas.
        if (namaTagihan.includes("pendaftaran")) {
             terbayar = jt.nominal; 
        } 
        else {
             // Jika bukan pendaftaran (misal SPP, Infaq), cek database riwayat bayar
             terbayar = riwayatBayar
                .filter((p) => p.id_jenis_pembayaran === jt.id_jenis_pembayaran && (p.status === 'lunas' || p.status === 'cicil'))
                .reduce((acc, curr) => acc + curr.nominal, 0);
        }

        // Hitung sisa (Pastikan tidak minus)
        const sisa = Math.max(0, jt.nominal - terbayar);

        return {
            id: jt.id_jenis_pembayaran,
            nama: jt.nama_pembayaran,
            total_tagihan: jt.nominal,
            terbayar: terbayar,
            sisa: sisa,
            // Status string untuk UI
            status: sisa <= 0 ? 'Lunas' : terbayar > 0 ? 'Belum Lunas' : 'Belum Lunas'
        };
    });

    // 4. Hitung Ringkasan (Total semua tagihan vs Total yang sudah dibayar)
    const totalSemua = listTagihan.reduce((acc, curr) => acc + curr.total_tagihan, 0);
    const terbayarSemua = listTagihan.reduce((acc, curr) => acc + curr.terbayar, 0);

    return NextResponse.json({
      siswa: dataSiswa,
      tagihan: listTagihan,
      ringkasan: {
        total: totalSemua,
        terbayar: terbayarSemua, // Otomatis bertambah karena 'listTagihan' sudah update di atas
        sisa: totalSemua - terbayarSemua
      }
    });

  } catch (error) {
    console.error("Error API Cek Tagihan:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}