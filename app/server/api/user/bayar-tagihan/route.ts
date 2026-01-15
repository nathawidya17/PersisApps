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
    const id_input = formData.get("id_siswa")?.toString(); 
    const metode = formData.get("metode")?.toString();
    const pengirim = formData.get("pengirim")?.toString();
    const itemsRaw = formData.get("items")?.toString();
    const file = formData.get("bukti") as File | null;

    if (!id_input || id_input === "undefined") {
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    }

    const items = JSON.parse(itemsRaw || "[]");
    let buktiUrl = null;

    // --- UPLOAD BUKTI ---
    if (metode === 'transfer' && file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `bukti_bayar_${id_input}_${Date.now()}.${fileExt}`;
        const filePath = `pembayaran/${fileName}`; 

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await supabase.storage.from('ppdb_uploads').upload(filePath, buffer, { contentType: file.type });
        const { data: urlData } = supabase.storage.from('ppdb_uploads').getPublicUrl(filePath);
        buktiUrl = urlData.publicUrl;
    }

    // --- SIMPAN KE DATABASE ---
    await prisma.$transaction(async (tx) => {
      const idInt = parseInt(id_input);
      let nisnTarget = "";
      let finalIdSiswa: number | null = null;
      let idPendaftaran: number | null = null;

      const siswaData = await tx.tb_siswa.findUnique({ where: { id_siswa: idInt } });
      if (siswaData) {
        nisnTarget = siswaData.NISN;
        finalIdSiswa = siswaData.id_siswa;
        const p = await tx.tb_pendaftaran.findFirst({ where: { nisn: nisnTarget } });
        idPendaftaran = p?.id_pendaftar || null;
      } else {
        const pendaftarData = await tx.tb_pendaftaran.findUnique({ where: { id_pendaftar: idInt } });
        if (pendaftarData) {
            nisnTarget = pendaftarData.nisn;
            idPendaftaran = pendaftarData.id_pendaftar;
        } else { throw new Error("Data tidak ditemukan."); }
      }

      const daftarUlang = await tx.tb_daftar_ulang.findFirst({
        where: { tb_pendaftaran: { nisn: nisnTarget } }
      });

      for (const item of items) {
        // Ambil nominal sesuai yang diketik user di frontend
        const nominal = parseInt(item.nominal_bayar) || 0;
        if (nominal <= 0) continue;

        if (item.nama.toLowerCase().includes("pendaftaran")) {
            if (!idPendaftaran) throw new Error("ID Pendaftaran tidak ditemukan.");
            
            await tx.tb_pembayaran_pendaftaran.create({
                data: {
                    id_pendaftaran: idPendaftaran,
                    nominal: nominal, // Input user (misal 50.000)
                    metode_pembayaran: metode === 'transfer' ? 'transfer' : 'cash',
                    status: 'belum', 
                    bukti_pembayaran: buktiUrl,
                    tanggal_bayar: new Date(),
                    created_at: new Date()
                }
            });
        } 
        else {
            if (!daftarUlang) throw new Error("Data Daftar Ulang belum dibuat.");

            await tx.tb_pembayaran_daftar_ulang.create({
              data: {
                id_daftar_ulang: daftarUlang.id_daftar_ulang,
                id_siswa: finalIdSiswa, 
                id_jenis_pembayaran: item.id_jenis,
                nominal: nominal, // Input user
                metode_pembayaran: metode === 'transfer' ? 'transfer' : 'cash',
                status: 'belum', 
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}