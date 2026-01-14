import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: Supabase URL/Key belum diset di .env");
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

// --- 1. METHOD GET (Cek NISN) ---
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nisn = searchParams.get('nisn');
    if (!nisn) return NextResponse.json({ error: "NISN diperlukan" }, { status: 400 });

    const existingUser = await prisma.tb_pendaftaran.findFirst({
      where: { nisn: nisn },
      select: { id_pendaftar: true }
    });

    return NextResponse.json({ exists: !!existingUser });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// --- 2. METHOD POST (Submit Data) ---
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const getVal = (key: string) => formData.get(key)?.toString() || "";
    const nisn = getVal("nisn");

    if (!nisn) return NextResponse.json({ error: "NISN Wajib diisi" }, { status: 400 });

    const existingSiswa = await prisma.tb_pendaftaran.findFirst({
      where: { nisn: nisn }
    });

    if (existingSiswa) {
      return NextResponse.json({ error: "NISN sudah terdaftar." }, { status: 409 });
    }

    // --- UPLOAD BUKTI PEMBAYARAN KE SUPABASE ---
    const file = formData.get("bukti_pembayaran") as File | null;
    let fileUrlMySQL = null;

    if (file && file.size > 0) {
      
      // --- VALIDASI TIPE FILE (HANYA GAMBAR) ---
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!validImageTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: "Hanya file gambar yang boleh diupload (JPG, JPEG, PNG)." 
        }, { status: 400 });
      }

      // --- VALIDASI UKURAN FILE (MAX 2MB) ---
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        return NextResponse.json({ 
          error: "Ukuran file terlalu besar. Maksimal 2MB." 
        }, { status: 400 });
      }
      // ----------------------------------------

      const fileExt = file.name.split('.').pop();
      const fileName = `bukti_${nisn}_${Date.now()}.${fileExt}`;
      const filePath = `bukti-pembayaran-pendaftaran/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase
        .storage
        .from('ppdb_uploads')
        .upload(filePath, buffer, { contentType: file.type, upsert: false });

      if (uploadError) {
        throw new Error("Gagal upload gambar: " + uploadError.message);
      }

      const { data: urlData } = supabase
        .storage
        .from('ppdb_uploads')
        .getPublicUrl(filePath);

      fileUrlMySQL = urlData.publicUrl;
    }

    // --- DATA PREPARATION ---
    const jalurMap: Record<string, any> = { "Umum": "umum", "Tahfidz": "tahfidz", "Prestasi": "prestasi" };

    const prestasiRaw = formData.get("prestasi");
    const prestasiListRaw = prestasiRaw ? JSON.parse(prestasiRaw as string) : [];

    // Filter Data Prestasi
    const validPrestasiData = prestasiListRaw
      .filter((p: any) => {
         const name = p.nama || p.nama_prestasi;
         return name && name.trim() !== "";
      })
      .map((p: any) => ({
        nama_prestasi: p.nama || p.nama_prestasi,
        jenis_prestasi: p.jenis || p.jenis_prestasi || "Non_Akademik",
        tingkat: p.tingkat || "Sekolah", 
        peringkat: p.peringkat || "-",
        tahun: p.tahun ? parseInt(p.tahun) : new Date().getFullYear(),
        penyelenggara: p.penyelenggara || "-"
      }));

    // --- SIMPAN KE DB (TRANSAKSI) ---
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Data Pendaftaran
      const pendaftaran = await tx.tb_pendaftaran.create({
        data: {
          // A. Data Diri
          nisn: nisn,
          jalur_pendaftaran: jalurMap[getVal("jalur_pendaftaran")] || 'umum',
          nama_lengkap: getVal("nama_lengkap"),
          email: getVal("email"),
          tempat_lahir: getVal("tempat_lahir"),
          tanggal_lahir: getVal("tanggal_lahir") ? new Date(getVal("tanggal_lahir")) : new Date(),
          jenis_kelamin: getVal("jenis_kelamin") as any,
          ukuran_baju: getVal("ukuran_baju") as any,
          no_hp: getVal("no_hp"),
          alamat_rumah: getVal("alamat_rumah"),
          rt: getVal("rt"),
          rw: getVal("rw"),
          kode_pos: getVal("kode_pos"),
          anak_ke: parseInt(getVal("anak_ke")) || 0,
          jumlah_saudara: parseInt(getVal("jumlah_saudara")) || 0,
          asal_sekolah: getVal("asal_sekolah"),
          alamat_sekolah: getVal("alamat_sekolah"),
          tahun_lulus: parseInt(getVal("tahun_lulus")) || 0,
          kode_pos_sekolah: getVal("kode_pos_sekolah"),

          status_seleksi: 'proses', 

          // B. Data Ortu
          nama_ayah: getVal("nama_ayah"),
          tempat_lahir_ayah: getVal("tempat_lahir_ayah"),
          tanggal_lahir_ayah: getVal("tanggal_lahir_ayah") ? new Date(getVal("tanggal_lahir_ayah")) : new Date(),
          pendidikan_ayah: getVal("pendidikan_ayah"),
          pekerjaan_ayah: getVal("pekerjaan_ayah"),
          penghasilan_ayah: getVal("penghasilan_ayah"),

          nama_ibu: getVal("nama_ibu"),
          tempat_lahir_ibu: getVal("tempat_lahir_ibu"),
          tanggal_lahir_ibu: getVal("tanggal_lahir_ibu") ? new Date(getVal("tanggal_lahir_ibu")) : new Date(),
          pendidikan_ibu: getVal("pendidikan_ibu"),
          pekerjaan_ibu: getVal("pekerjaan_ibu"),
          penghasilan_ibu: getVal("penghasilan_ibu"),
          no_hp_orang_tua: getVal("no_hp_orang_tua"),

          // C. Data Prestasi
          tb_prestasi_pendaftar: {
            create: validPrestasiData
          }
        },
      });

      // 2. Create Data Pembayaran
      const paymentMethod = getVal("paymentMethod").toLowerCase();
      const nominalClean = parseInt(getVal("jumlah_dibayar").replace(/[^0-9]/g, '')) || 200000;

      await tx.tb_pembayaran_pendaftaran.create({
        data: {
          id_pendaftaran: pendaftaran.id_pendaftar,
          nominal: nominalClean,
          metode_pembayaran: paymentMethod === 'transfer' ? 'transfer' : 'cash',
          status: (paymentMethod === 'transfer' ? 'menunggu' : 'belum') as any,
          bukti_pembayaran: fileUrlMySQL,
          tanggal_bayar: new Date(),
          created_at: new Date()
        }
      });

      return pendaftaran;
    });

    return NextResponse.json({ message: "Berhasil mendaftar", data: result }, { status: 201 });

  } catch (error: any) {
    console.error("❌ ERROR SUBMIT DATA:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}