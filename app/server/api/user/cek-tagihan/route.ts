import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterTagihanByGender } from "@/lib/validationByGender";

export async function POST(req: Request) {
  try {
    const { nisn } = await req.json();

    // 1. Cari Data Siswa (Prioritas 1: Siswa Aktif / Sudah Lunas Full)
    const siswa = await prisma.tb_siswa.findUnique({
      where: { NISN: nisn },
      include: {
        tb_pembayaran_daftar_ulang: true 
      }
    });

    let dataSiswa = null;
    let riwayatBayarDaftarUlang: any[] = [];
    let riwayatBayarPendaftaran: any[] = []; // TAMBAHAN: Untuk cek cicilan pendaftaran

    // KONDISI A: Ketemu di tb_siswa (Sudah fix jadi siswa)
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
      riwayatBayarDaftarUlang = siswa.tb_pembayaran_daftar_ulang;
      
      // Ambil juga history pendaftaran dari tabel pendaftaran (via NISN) untuk kalkulasi total
      const dataPendaftaranLama = await prisma.tb_pendaftaran.findFirst({
          where: { nisn: nisn },
          include: { tb_pembayaran_pendaftaran: true }
      });
      if(dataPendaftaranLama) {
          riwayatBayarPendaftaran = dataPendaftaranLama.tb_pembayaran_pendaftaran;
      }

    } 
    // KONDISI B: Masih Calon (Cari di tb_pendaftaran)
    else {
      const pendaftar = await prisma.tb_pendaftaran.findFirst({
        where: { nisn: nisn },
        include: {
            tb_pembayaran_pendaftaran: true, // INCLUDE PENTING
            tb_daftar_ulang: {
                include: {
                    tb_pembayaran_daftar_ulang: true 
                }
            }
        }
      });

      if (!pendaftar) {
        return NextResponse.json({ error: "NISN tidak ditemukan." }, { status: 404 });
      }

      // Validasi akses (minimal status diterima atau sudah masuk daftar ulang)
      const sudahMasukDaftarUlang = pendaftar.tb_daftar_ulang.length > 0;
      if (pendaftar.status_seleksi !== 'diterima' && !sudahMasukDaftarUlang) {
        return NextResponse.json({ error: "Status siswa belum tahap Daftar Ulang." }, { status: 400 });
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
      
      // Ambil Riwayat Pendaftaran
      riwayatBayarPendaftaran = pendaftar.tb_pembayaran_pendaftaran;

      // Ambil Riwayat Daftar Ulang
      if (sudahMasukDaftarUlang) {
          riwayatBayarDaftarUlang = pendaftar.tb_daftar_ulang[0].tb_pembayaran_daftar_ulang;
      }
    }

    // 2. Ambil Semua Jenis Tagihan yang Aktif
    let jenisTagihan = await prisma.tb_jenis_pembayaran.findMany({
        where: { status: 'aktif' } 
    });

    // Filter tagihan berdasarkan gender
    jenisTagihan = filterTagihanByGender(jenisTagihan, dataSiswa.jenis_kelamin);

    // 3. Hitung Status Per Tagihan
    const listTagihan = jenisTagihan.map((jt) => {
        let terbayar = 0;
        const namaTagihan = jt.nama_pembayaran.toLowerCase().trim();

        // --- LOGIC PERBAIKAN: PENDAFTARAN ---
        // Cek apakah ini tagihan pendaftaran?
        if (namaTagihan.includes("pendaftaran")) {
             // Hitung total dari tabel tb_pembayaran_pendaftaran
             terbayar = riwayatBayarPendaftaran
                .filter((p) => p.status === 'lunas' || p.status === 'cicil')
                .reduce((acc, curr) => acc + Number(curr.nominal), 0);
        } 
        else {
             // Tagihan Daftar Ulang (Infaq, Seragam, dll)
             // Cek riwayat dari tabel tb_pembayaran_daftar_ulang
             terbayar = riwayatBayarDaftarUlang
                .filter((p) => p.id_jenis_pembayaran === jt.id_jenis_pembayaran && (p.status === 'lunas' || p.status === 'cicil'))
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
            status: sisa <= 0 ? 'Lunas' : terbayar > 0 ? 'Belum Lunas' : 'Belum Lunas'
        };
    });

    // 4. Hitung Ringkasan Global
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