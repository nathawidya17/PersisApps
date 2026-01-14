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
    const id_input = formData.get("id_siswa")?.toString(); // Bisa ID Siswa atau ID Pendaftar
    const metode = formData.get("metode")?.toString();
    const pengirim = formData.get("pengirim")?.toString();
    const itemsRaw = formData.get("items")?.toString();
    const file = formData.get("bukti") as File | null;

    if (!id_input || id_input === "undefined") {
      return NextResponse.json({ error: "ID Siswa/Pendaftar tidak valid." }, { status: 400 });
    }

    const items = JSON.parse(itemsRaw || "[]");
    let buktiUrl = null;

    // --- LOGIC UPLOAD FILE (TRANSFER) ---
    if (metode === 'transfer') {
        if (!file || file.size === 0) {
            return NextResponse.json({ error: "Wajib upload bukti pembayaran untuk metode Transfer." }, { status: 400 });
        }

        const validImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (!validImageTypes.includes(file.type)) {
            return NextResponse.json({ error: "Hanya file gambar yang boleh diupload (JPG, PNG)." }, { status: 400 });
        }

        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: "Ukuran file terlalu besar. Maksimal 2MB." }, { status: 400 });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `bukti_du_${id_input}_${Date.now()}.${fileExt}`;
        const filePath = `bukti-pembayaran-daftar-ulang/${fileName}`; 
        const bucketName = 'ppdb_uploads'; 

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, { contentType: file.type, upsert: false });

        if (uploadError) {
            console.error("Upload Error:", uploadError);
            throw new Error("Gagal upload gambar ke server.");
        }

        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        buktiUrl = urlData.publicUrl;
    }

    // --- SIMPAN KE DATABASE (TRANSACTION) ---
    await prisma.$transaction(async (tx) => {
      const idInt = parseInt(id_input);
      let nisnTarget = "";
      let finalIdSiswa: number | null = null;

      // 1. CEK DATA SISWA/PENDAFTAR (PERBAIKAN UTAMA DISINI)
      // Coba cari di tb_siswa dulu (User sudah resmi jadi siswa)
      const siswaData = await tx.tb_siswa.findUnique({
        where: { id_siswa: idInt }
      });

      if (siswaData) {
        // Jika ketemu di tb_siswa
        nisnTarget = siswaData.NISN;
        finalIdSiswa = siswaData.id_siswa;
      } else {
        // Jika tidak ketemu, cari di tb_pendaftaran (User masih calon/baru divalidasi admin)
        // Dalam kasus ini, id_input adalah id_pendaftar
        const pendaftarData = await tx.tb_pendaftaran.findUnique({
            where: { id_pendaftar: idInt }
        });

        if (pendaftarData) {
            nisnTarget = pendaftarData.nisn;
            finalIdSiswa = null; // Belum masuk tb_siswa, jadi field id_siswa di pembayaran NULL
        } else {
            throw new Error("Data Siswa atau Pendaftar tidak ditemukan.");
        }
      }

      // 2. AMBIL ID DAFTAR ULANG (Relasi via NISN)
      const daftarUlang = await tx.tb_daftar_ulang.findFirst({
        where: { tb_pendaftaran: { nisn: nisnTarget } }
      });

      if (!daftarUlang) {
         // Jika divalidasi admin, harusnya data ini ada. 
         // Jika error disini, berarti validasi admin belum membuat record tb_daftar_ulang.
         throw new Error("Data Daftar Ulang belum dibuat. Hubungi Admin.");
      }

      // 3. LOOPING ITEM PEMBAYARAN
      for (const item of items) {
        if (!item.nama.toLowerCase().includes("pendaftaran")) {
            const nominalPerItem = item.nominal_bayar ? parseInt(item.nominal_bayar) : 0;

            await tx.tb_pembayaran_daftar_ulang.create({
              data: {
                id_daftar_ulang: daftarUlang.id_daftar_ulang,
                
                // Gunakan finalIdSiswa (bisa angka ID, bisa NULL jika belum resmi siswa)
                id_siswa: finalIdSiswa, 
                
                id_jenis_pembayaran: item.id_jenis,
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