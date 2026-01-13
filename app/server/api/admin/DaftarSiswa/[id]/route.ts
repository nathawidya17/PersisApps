import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Cek apakah ID atau NISN
    // Asumsi frontend mengirim ID SISWA
    const idSiswa = Number(id);
    
    // 1. Ambil Data Siswa (Termasuk Pembayaran Daftar Ulang)
    const siswa = await prisma.tb_siswa.findFirst({
      where: { 
        OR: [
            { id_siswa: isNaN(idSiswa) ? -1 : idSiswa },
            { NISN: id }
        ]
      },
      include: {
        tb_orang_tua: true,
        tb_prestasi: true,
        tb_dokumen: true,
        tb_pembayaran_daftar_ulang: {
            include: { tb_jenis_pembayaran: true } // Include jenis biar nama tagihan muncul
        }
      }
    });

    if (!siswa) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    // 2. Ambil Pembayaran Pendaftaran (Cari manual via NISN di tabel sebelah)
    // Cari ID Pendaftaran dulu via NISN
    const pendaftaran = await prisma.tb_pendaftaran.findFirst({
        where: { nisn: siswa.NISN }
    });

    let historyPendaftaran: any[] = [];
    if (pendaftaran) {
        historyPendaftaran = await prisma.tb_pembayaran_pendaftaran.findMany({
            where: { id_pendaftaran: pendaftaran.id_pendaftar }
        });
    }

    // 3. Gabungkan Data
    // Kita inject historyPendaftaran ke dalam object response agar frontend bisa baca
    const finalData = {
        ...siswa,
        // Mapping Data Ortu (Flat)
        nama_ayah: siswa.tb_orang_tua[0]?.nama_ayah || "-",
        pekerjaan_ayah: siswa.tb_orang_tua[0]?.pekerjaan_ayah || "-",
        pendidikan_ayah: siswa.tb_orang_tua[0]?.pendidikan_ayah || "-",
        no_hp_orang_tua: siswa.tb_orang_tua[0]?.no_hp_orang_tua || "-",
        tempat_lahir_ayah: siswa.tb_orang_tua[0]?.tempat_lahir_ayah || "-",
        tanggal_lahir_ayah: siswa.tb_orang_tua[0]?.tanggal_lahir_ayah,
        penghasilan_ayah: siswa.tb_orang_tua[0]?.penghasilan_ayah || "-",
        
        nama_ibu: siswa.tb_orang_tua[0]?.nama_ibu || "-",
        pekerjaan_ibu: siswa.tb_orang_tua[0]?.pekerjaan_ibu || "-",
        pendidikan_ibu: siswa.tb_orang_tua[0]?.pendidikan_ibu || "-",
        tempat_lahir_ibu: siswa.tb_orang_tua[0]?.tempat_lahir_ibu || "-",
        tanggal_lahir_ibu: siswa.tb_orang_tua[0]?.tanggal_lahir_ibu,
        penghasilan_ibu: siswa.tb_orang_tua[0]?.penghasilan_ibu || "-",
        
        alamat_orang_tua: siswa.alamat || "-",

        // GABUNGAN PEMBAYARAN (PENTING)
        tb_pembayaran_pendaftaran: historyPendaftaran, 
        // tb_pembayaran_daftar_ulang sudah ada di object 'siswa' karena include di atas
    };

    // 4. Master Tagihan
    const jenisTagihan = await prisma.tb_jenis_pembayaran.findMany({ where: { status: 'aktif' } });

    return NextResponse.json({ detailSiswa: finalData, jenisTagihan });

  } catch (error: any) {
    console.error("Error Detail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    // ... Copy delete function from previous response or keep existing ...
    // Intinya delete dari tb_siswa
    try {
        const { id } = await params;
        const idSiswa = Number(id);
        await prisma.$transaction(async (tx) => {
            await tx.tb_pembayaran_daftar_ulang.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_orang_tua.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_prestasi.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_dokumen.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_siswa.delete({ where: { id_siswa: idSiswa } });
        });
        return NextResponse.json({ message: "Deleted" });
    } catch(e:any) { return NextResponse.json({error: e.message}, {status:500}); }
}