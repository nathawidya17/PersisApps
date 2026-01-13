import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawSiswa = await prisma.tb_siswa.findMany({
      orderBy: { updated_at: 'desc' },
      include: {
        tb_orang_tua: true
      }
    });

    const processedData = rawSiswa.map((siswa) => {
        return {
            ...siswa,
            id: siswa.id_siswa,
            nama_ayah: siswa.tb_orang_tua[0]?.nama_ayah || "-",
            nama_ibu: siswa.tb_orang_tua[0]?.nama_ibu || "-",
            
            // JANGAN DI OTAK ATIK. 
            // Ambil apa adanya dari database. Database bilang lunas, ya lunas.
            status_pembayaran: siswa.status_pembayaran 
        };
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}