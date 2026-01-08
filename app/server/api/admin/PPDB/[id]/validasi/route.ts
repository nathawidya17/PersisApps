import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { id_pendaftar } = await req.json();

    // 1. Ambil data pendaftaran beserta status pembayarannya
    const pendaftaran = await prisma.tb_pendaftaran.findUnique({
      where: { id_pendaftar },
      include: { 
        tb_pembayaran_pendaftaran: true,
        tb_daftar_ulang: {
            include: { tb_pembayaran_daftar_ulang: true }
        }
      }
    });

    if (!pendaftaran) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

    // --- LOGIKA A: VALIDASI DARI PENDAFTARAN KE DAFTAR ULANG ---
    // Cek apakah data sudah ada di tb_daftar_ulang (artinya dia tahap 1)
    const isAlreadyDaftarUlang = pendaftaran.tb_daftar_ulang.length > 0;

    if (!isAlreadyDaftarUlang) {
      // ATURAN: Harus LUNAS pendaftaran
      const isLunasPendaftaran = pendaftaran.tb_pembayaran_pendaftaran.some(p => p.status === 'lunas');
      
      if (!isLunasPendaftaran) {
        return NextResponse.json({ error: "Gagal: Pendaftaran belum lunas!" }, { status: 400 });
      }

      // Masukkan ke tb_daftar_ulang (Menampung saja)
      await prisma.tb_daftar_ulang.create({
        data: {
          id_pendaftar: pendaftaran.id_pendaftar,
          status_validasi: "menunggu"
        }
      });

      return NextResponse.json({ success: true, message: "Berhasil divalidasi ke tahap Daftar Ulang" });
    }

    // --- LOGIKA B: VALIDASI DARI DAFTAR ULANG KE SISWA TETAP ---
    else {
      // ATURAN: Minimal sudah bayar 1 kali di daftar ulang
      const hasPaymentDaftarUlang = pendaftaran.tb_daftar_ulang[0].tb_pembayaran_daftar_ulang.length > 0;

      if (!hasPaymentDaftarUlang) {
        return NextResponse.json({ error: "Gagal: Siswa belum melakukan pembayaran daftar ulang!" }, { status: 400 });
      }

      // PROSES TRANSAKSI PINDAH DATA (OPER DATA)
      const result = await prisma.$transaction(async (tx) => {
        // 1. Pindah ke tb_siswa
        const siswa = await tx.tb_siswa.create({
          data: {
            NISN: pendaftaran.nisn.substring(0, 10),
            nama_lengkap: pendaftaran.nama_lengkap,
            tempat_lahir: pendaftaran.tempat_lahir,
            tanggal_lahir: pendaftaran.tanggal_lahir,
            jenis_kelamin: pendaftaran.jenis_kelamin === 'Putra' ? 'Putra' : 'Putri',
            no_hp: pendaftaran.no_hp,
            alamat: pendaftaran.alamat_rumah,
            anak_ke: pendaftaran.anak_ke,
            jumlah_saudara: pendaftaran.jumlah_saudara,
            asal_sekolah: pendaftaran.asal_sekolah,
            tahun_lulus: 2026,
            alamat_sekolah: pendaftaran.alamat_sekolah || "-",
            jalur_pendaftaran: pendaftaran.jalur_pendaftaran,
            status_pembayaran: "belum_lunas"
          }
        });

        // 2. Pindah data orang tua
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
          }
        });

        // 3. Hapus relasi pendaftaran (Cleanup)
        await tx.tb_pembayaran_pendaftaran.deleteMany({ where: { id_pendaftaran: id_pendaftar } });
        await tx.tb_pembayaran_daftar_ulang.deleteMany({ where: { id_daftar_ulang: pendaftaran.tb_daftar_ulang[0].id_daftar_ulang } });
        await tx.tb_daftar_ulang.deleteMany({ where: { id_pendaftar: id_pendaftar } });
        await tx.tb_pendaftaran.delete({ where: { id_pendaftar } });

        return siswa;
      });

      return NextResponse.json({ success: true, message: "Siswa resmi divalidasi menjadi Siswa Tetap", data: result });
    }

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}