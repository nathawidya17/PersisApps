import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL atau Key belum diset di .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // --- AMBIL DATA ---
    const id_siswa = formData.get("id_siswa")?.toString();
    const metode = formData.get("metode")?.toString();
    const bank = formData.get("bank")?.toString();
    const pengirim = formData.get("pengirim")?.toString();
    // nominal_bayar global (total semua) tidak kita pakai di loop, tapi bisa buat validasi kalau mau
    const nominal_bayar_global = formData.get("nominal_bayar")?.toString(); 
    const itemsRaw = formData.get("items")?.toString();
    const file = formData.get("bukti") as File | null;

    if (!id_siswa || id_siswa === "undefined") {
      return NextResponse.json({ error: "ID Siswa tidak valid." }, { status: 400 });
    }

    const items = JSON.parse(itemsRaw || "[]");
    let buktiUrl = null;

    // --- LOGIC UPLOAD & VALIDASI FILE ---
    if (metode === 'transfer') {
        if (!file || file.size === 0) {
            return NextResponse.json({ error: "Wajib upload bukti pembayaran untuk metode Transfer." }, { status: 200 });
        }

        const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: "Hanya file gambar yang boleh diupload (JPG, PNG)." }, { status: 200 });
        }

        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "Ukuran file terlalu besar. Maksimal 2MB." }, { status: 200 });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `bukti_${id_siswa}_${Date.now()}.${fileExt}`;
        const bucketName = 'ppdb_uploads'; 

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, buffer, { contentType: file.type, upsert: false });

        if (uploadError) {
            console.error("Upload Error:", uploadError);
            throw new Error("Gagal upload gambar ke server.");
        }

        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        buktiUrl = urlData.publicUrl;
    }

    // --- SIMPAN KE DATABASE ---
    await prisma.$transaction(async (tx) => {
      const siswaData = await tx.tb_siswa.findUnique({where:{id_siswa: parseInt(id_siswa)}});
      if(!siswaData?.NISN) throw new Error("Data Siswa tidak ditemukan.");

      const daftarUlang = await tx.tb_daftar_ulang.findFirst({
        where: { tb_pendaftaran: { nisn: siswaData.NISN } }
      });
      if (!daftarUlang) throw new Error("Data Daftar Ulang tidak ditemukan.");

      for (const item of items) {
        if (!item.nama.toLowerCase().includes("pendaftaran")) {
            // FIX DISINI: 
            // Gunakan item.nominal_bayar (nominal per item) BUKAN nominal_bayar_global
            // Jika item.nominal_bayar tidak ada (undefined), fallback ke 0.
            const nominalPerItem = item.nominal_bayar ? parseInt(item.nominal_bayar) : 0;

            await tx.tb_pembayaran_daftar_ulang.create({
              data: {
                id_daftar_ulang: daftarUlang.id_daftar_ulang,
                id_siswa: parseInt(id_siswa),
                id_jenis_pembayaran: item.id_jenis,
                
                // Gunakan Nominal Spesifik Per Item
                nominal: nominalPerItem, 
                
                metode_pembayaran: metode === 'transfer' ? 'transfer' : 'cash',
                status: 'menunggu',
                bukti_pembayaran: buktiUrl,
                approved_by: pengirim, 
                tanggal_bayar: new Date()
              }
            });
        }
      }
    });

    return NextResponse.json({ message: "Pembayaran berhasil disimpan" });

  } catch (error: any) {
    console.error("SERVER ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}