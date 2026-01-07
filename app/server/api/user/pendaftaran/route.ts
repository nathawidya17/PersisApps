import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // 1. Ambil data menggunakan formData(), BUKAN json()
    const formData = await req.formData();
    
    // 2. Logika Simpan File Bukti Pembayaran ke Folder Public
    const file = formData.get("bukti_pembayaran") as File | null;
    let fileName = "";

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Membuat nama file unik untuk disimpan di database (VARCHAR)
      fileName = `bukti_${Date.now()}_${file.name.replaceAll(" ", "_")}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "bukti");
      
      // Memastikan direktori tujuan tersedia
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), buffer);
    }

    // 3. Ekstrak data teks dari FormData
    const jalurMap: Record<string, any> = {
      "Umum": "umum",
      "Tahfidz": "tahfidz",
      "Prestasi": "prestasi"
    };

    // Helper untuk mengambil value dari formData
    const getVal = (key: string) => formData.get(key)?.toString() || "";

    // Parse data prestasi (dikirim sebagai string JSON dari frontend)
    const prestasiRaw = formData.get("prestasi");
    const prestasiList = prestasiRaw ? JSON.parse(prestasiRaw as string) : [];
    const firstPrestasi = prestasiList[0] || {};

    // 4. Jalankan Transaction Prisma
    const result = await prisma.$transaction(async (tx) => {
      // Simpan ke tb_pendaftaran
      const pendaftaran = await tx.tb_pendaftaran.create({
        data: {
          nisn: getVal("nisn"),
          jalur_pendaftaran: jalurMap[getVal("jalur_pendaftaran")] || 'umum',
          nama_lengkap: getVal("nama_lengkap"),
          email: getVal("email"),
          tempat_lahir: getVal("tempat_lahir") || "-",
          tanggal_lahir: getVal("tanggal_lahir") ? new Date(getVal("tanggal_lahir")) : new Date(),
          jenis_kelamin: getVal("jenis_kelamin") as any, 
          ukuran_baju: getVal("ukuran_baju") as any,
          no_hp: getVal("no_hp"),
          alamat_rumah: getVal("alamat_rumah"),
          rt: getVal("rt"),
          rw: getVal("rw"),
          anak_ke: parseInt(getVal("anak_ke")) || 0,
          jumlah_saudara: parseInt(getVal("jumlah_saudara")) || 0,
          asal_sekolah: getVal("asal_sekolah"),
          alamat_sekolah: getVal("alamat_sekolah"),
          tahun_lulus: parseInt(getVal("tahun_lulus")) || 0,
          kode_pos_sekolah: getVal("kode_pos_sekolah"),
          
          // Data Orang Tua
          nama_ayah: getVal("nama_ayah"),
          tempat_lahir_ayah: getVal("tempat_lahir_ayah") || "-",
          tanggal_lahir_ayah: getVal("tanggal_lahir_ayah") ? new Date(getVal("tanggal_lahir_ayah")) : new Date(),
          pendidikan_ayah: getVal("pendidikan_ayah"),
          pekerjaan_ayah: getVal("pekerjaan_ayah"),
          penghasilan_ayah: getVal("penghasilan_ayah"),
          
          nama_ibu: getVal("nama_ibu"),
          tempat_lahir_ibu: getVal("tempat_lahir_ibu") || "-",
          tanggal_lahir_ibu: getVal("tanggal_lahir_ibu") ? new Date(getVal("tanggal_lahir_ibu")) : new Date(),
          pendidikan_ibu: getVal("pendidikan_ibu"),
          pekerjaan_ibu: getVal("pekerjaan_ibu"),
          penghasilan_ibu: getVal("penghasilan_ibu"),
          no_hp_orang_tua: getVal("no_hp_orang_tua"),
          
          // Data Prestasi
          nama_prestasi: firstPrestasi.nama || null,
          jenis_prestasi: firstPrestasi.jenis_prestasi || null,
          tingkat: firstPrestasi.tingkat || null,
          peringkat: firstPrestasi.peringkat || null,
          tahun: firstPrestasi.tahun ? parseInt(firstPrestasi.tahun) : null,
          penyelenggara: firstPrestasi.penyelenggara || null,
        },
      });

      // Simpan ke tb_pembayaran_pendaftaran
      const paymentMethod = getVal("paymentMethod").toLowerCase();
      await tx.tb_pembayaran_pendaftaran.create({
        data: {
          id_pendaftaran: pendaftaran.id_pendaftar,
          nominal: parseInt(getVal("jumlah_dibayar").replace(/[^0-9]/g, '')) || 200000,
          metode_pembayaran: paymentMethod === 'transfer' ? 'transfer' : 'cash',
          status: (paymentMethod === 'transfer' ? 'menunggu' : 'belum') as any,
          bukti_pembayaran: fileName || null, // Nama file yang sudah disimpan di public
        }
      });

      return pendaftaran;
    });

    return NextResponse.json({ message: "Berhasil", data: result }, { status: 201 });

  } catch (error: any) {
    console.error("Error Detail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}