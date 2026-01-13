import { createClient } from '@supabase/supabase-js';

// Pastikan env variable ini ada di file .env Anda
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- INI FUNGSI YANG HILANG ---
export async function uploadToSupabase(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
) {
  // Ganti 'bukti-pembayaran' dengan nama bucket di Storage Supabase Anda
  const BUCKET_NAME = 'bukti-pembayaran'; 

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Ambil URL Publik agar bisa disimpan di Database
  const { data: publicData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  return publicData.publicUrl;
}