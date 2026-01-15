import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { createClient } from '@supabase/supabase-js';
import { isValidTagihanForGender } from "@/lib/validationByGender";

// --- KONFIGURASI SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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
    const jumlah_dibayar_string = formData.get("jumlah_dibayar") as string; 
    const file = formData.get("bukti_pembayaran") as File | null;

    // Validasi Input Dasar
    if (!nisn || !tagihan_ids_string) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const tagihanIds = JSON.parse(tagihan_ids_string); 
    const jumlah_dibayar = jumlah_dibayar_string ? parseInt(jumlah_dibayar_string) : 0; 

    // Validasi NISN
    if (nisn.length !== 10) {
      return NextResponse.json({ error: "NISN harus 10 digit" }, { status: 400 });
    } 

    // 2. Cek Data Pendaftar
    const pendaftar = await prisma.tb_pendaftaran.findFirst({
      where: { nisn: nisn },
    });

    if (!pendaftar) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    const jenis_kelamin = pendaftar.jenis_kelamin;
    if (!jenis_kelamin) {
      return NextResponse.json({ error: "Data jenis kelamin siswa tidak ditemukan" }, { status: 400 });
    }

    // 3. Handle Upload File (Supabase)
    let fileUrlMySQL = null;
    const isTransfer = metodeInput.toLowerCase() === "transfer";

    if (isTransfer) {
      if (!file || file.size === 0) {
        return NextResponse.json({ error: "Wajib upload bukti pembayaran untuk metode Transfer." }, { status: 200 });
      }

      const validImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!validImageTypes.includes(file.type)) {
        return NextResponse.json({ error: "Hanya file gambar yang boleh diupload (JPG, PNG)." }, { status: 200 });
      }

      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        return NextResponse.json({ error: "Ukuran file terlalu besar. Maksimal 2MB." }, { status: 200 });
      }

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

      const { data: urlData } = supabase.storage.from('ppdb_uploads').getPublicUrl(filePath);
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
        where: { id_jenis_pembayaran: { in: tagihanIds } },
      });

      for (const tagihan of detailTagihan) {
        if (!isValidTagihanForGender(tagihan.nama_pembayaran, jenis_kelamin)) {
          throw new Error(`Tagihan "${tagihan.nama_pembayaran}" tidak sesuai dengan jenis kelamin Anda.`);
        }
      }

      // C. Simpan Pembayaran
      // Logic pembagian nominal per item (jika user bayar cicil/custom)
      const nominalPerItem = jumlah_dibayar > 0 ? Math.floor(jumlah_dibayar / detailTagihan.length) : 0;
      
      await Promise.all(detailTagihan.map(async (tagihan) => {
        return tx.tb_pembayaran_daftar_ulang.create({
          data: {
            id_daftar_ulang: daftarUlang!.id_daftar_ulang,
            id_jenis_pembayaran: tagihan.id_jenis_pembayaran,
            id_siswa: null, 
            nominal: jumlah_dibayar > 0 ? nominalPerItem : tagihan.nominal, 
            metode_pembayaran: isTransfer ? "transfer" : "cash",
            
            // --- PERBAIKAN UTAMA DI SINI ---
            // SELALU set 'belum' agar Admin wajib approve dulu.
            // Setelah di-approve, sistem PATCH admin yang akan menghitung apakah ini Cicil atau Lunas.
            status: "belum", 
            
            bukti_pembayaran: fileUrlMySQL, 
            tanggal_bayar: new Date(),
          },
        });
      }));

      return daftarUlang;
    });

    return NextResponse.json({ 
      success: true, 
      message: "Pembayaran berhasil dikirim. Menunggu verifikasi admin.", // Update pesan biar jelas
      data: result 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error submit daftar ulang:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}