import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { createClient } from '@supabase/supabase-js';
import { isValidTagihanForGender } from "@/lib/validationByGender";

// --- KONFIGURASI SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Gunakan Service Role Key untuk akses tulis (atau Anon Key jika RLS diatur public)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL atau Key belum diset di .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // 1. Ambil Data dari Frontend
    const nisn = formData.get("nisn") as string;
    const metodeInput = formData.get("metode_pembayaran") as string; 
    const tagihan_ids_string = formData.get("tagihan_ids") as string;
    const file = formData.get("bukti_pembayaran") as File | null;

    // Validasi Input Dasar
    if (!nisn || !tagihan_ids_string) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const tagihanIds = JSON.parse(tagihan_ids_string); 

    // 2. Cek Data Pendaftar
    const pendaftar = await prisma.tb_pendaftaran.findFirst({
      where: { nisn: nisn },
    });

    if (!pendaftar) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    // Get jenis_kelamin from pendaftar (akan ada ketika di validasi)
    const jenis_kelamin = pendaftar.jenis_kelamin;
    if (!jenis_kelamin) {
      return NextResponse.json({ error: "Data jenis kelamin siswa tidak ditemukan" }, { status: 400 });
    }

    // 3. Handle Upload File ke Supabase (Jika Transfer)
    let fileUrlMySQL = null;
    const isTransfer = metodeInput.toLowerCase() === "transfer";

    if (isTransfer) {
      // A. Cek Keberadaan File
      if (!file || file.size === 0) {
        // Return 200 agar frontend bisa menangkap pesan error dengan mudah
        return NextResponse.json({ error: "Wajib upload bukti pembayaran untuk metode Transfer." }, { status: 200 });
      }

      // B. VALIDASI TIPE FILE (HANYA GAMBAR)
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!validImageTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: "Hanya file gambar yang boleh diupload (JPG, PNG)." 
        }, { status: 200 });
      }

      // C. VALIDASI UKURAN FILE (MAX 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        return NextResponse.json({ 
          error: "Ukuran file terlalu besar. Maksimal 2MB." 
        }, { status: 200 });
      }

      // --- PROSES UPLOAD ---
      const fileExt = file.name.split('.').pop();
      const fileName = `bukti_du_${nisn}_${Date.now()}.${fileExt}`;
      const filePath = `bukti-pembayaran-daftar-ulang/${fileName}`; 

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase
        .storage
        .from('ppdb_uploads') 
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error("Supabase Upload Error:", uploadError);
        throw new Error("Gagal mengupload bukti pembayaran.");
      }

      const { data: urlData } = supabase
        .storage
        .from('ppdb_uploads')
        .getPublicUrl(filePath);
      
      fileUrlMySQL = urlData.publicUrl; 
    }

    // 4. DATABASE TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Cek/Buat Record Daftar Ulang
      let daftarUlang = await tx.tb_daftar_ulang.findFirst({
        where: { id_pendaftar: pendaftar.id_pendaftar }
      });

      if (!daftarUlang) {
        daftarUlang = await tx.tb_daftar_ulang.create({
          data: {
            id_pendaftar: pendaftar.id_pendaftar,
            created_at: new Date(),
          },
        });
      }

      // B. Ambil detail tagihan
      const detailTagihan = await tx.tb_jenis_pembayaran.findMany({
        where: {
          id_jenis_pembayaran: { in: tagihanIds },
        },
      });

      // B1. Validasi bahwa semua tagihan sesuai dengan jenis kelamin siswa
      for (const tagihan of detailTagihan) {
        if (!isValidTagihanForGender(tagihan.nama_pembayaran, jenis_kelamin)) {
          throw new Error(`Tagihan "${tagihan.nama_pembayaran}" tidak sesuai dengan jenis kelamin Anda.`);
        }
      }

      // C. Simpan Pembayaran (Looping async)
      await Promise.all(detailTagihan.map(async (tagihan) => {
        return tx.tb_pembayaran_daftar_ulang.create({
          data: {
            id_daftar_ulang: daftarUlang!.id_daftar_ulang,
            id_jenis_pembayaran: tagihan.id_jenis_pembayaran,
            id_siswa: null, 
            nominal: tagihan.nominal,
            metode_pembayaran: isTransfer ? "transfer" : "cash",
            status: isTransfer ? "menunggu" : "belum", 
            bukti_pembayaran: fileUrlMySQL, 
            tanggal_bayar: new Date(),
          },
        });
      }));

      return daftarUlang;
    });

    return NextResponse.json({ 
      success: true, 
      message: "Pembayaran berhasil disimpan.",
      data: result 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error submit daftar ulang:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}