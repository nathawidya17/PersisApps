import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// === GET: DETAIL SISWA ===
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const idSiswa = Number(id);
    
    // 1. Ambil Data Siswa
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
            include: { tb_jenis_pembayaran: true } 
        }
      }
    });

    if (!siswa) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    // 2. Ambil Pembayaran Pendaftaran
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
    const finalData = {
        ...siswa,
        // Mapping Data Ortu agar flat di frontend
        nama_ayah: siswa.tb_orang_tua[0]?.nama_ayah || "",
        pekerjaan_ayah: siswa.tb_orang_tua[0]?.pekerjaan_ayah || "",
        pendidikan_ayah: siswa.tb_orang_tua[0]?.pendidikan_ayah || "",
        no_hp_orang_tua: siswa.tb_orang_tua[0]?.no_hp_orang_tua || "",
        tempat_lahir_ayah: siswa.tb_orang_tua[0]?.tempat_lahir_ayah || "",
        tanggal_lahir_ayah: siswa.tb_orang_tua[0]?.tanggal_lahir_ayah,
        penghasilan_ayah: siswa.tb_orang_tua[0]?.penghasilan_ayah || "",
        
        nama_ibu: siswa.tb_orang_tua[0]?.nama_ibu || "",
        pekerjaan_ibu: siswa.tb_orang_tua[0]?.pekerjaan_ibu || "",
        pendidikan_ibu: siswa.tb_orang_tua[0]?.pendidikan_ibu || "",
        tempat_lahir_ibu: siswa.tb_orang_tua[0]?.tempat_lahir_ibu || "",
        tanggal_lahir_ibu: siswa.tb_orang_tua[0]?.tanggal_lahir_ibu,
        penghasilan_ibu: siswa.tb_orang_tua[0]?.penghasilan_ibu || "",
        
        alamat_orang_tua: siswa.alamat || "", // Fallback ke alamat siswa

        tb_pembayaran_pendaftaran: historyPendaftaran, 
        tb_pembayaran_daftar_ulang: siswa.tb_pembayaran_daftar_ulang
    };

    const jenisTagihan = await prisma.tb_jenis_pembayaran.findMany({ where: { status: 'aktif' } });

    return NextResponse.json({ detailSiswa: finalData, jenisTagihan });

  } catch (error: any) {
    console.error("Error Detail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// === PUT: EDIT DATA SISWA & ORANG TUA (INI YANG HILANG TADI) ===
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const idSiswa = Number(id);
    const body = await req.json();

    if (isNaN(idSiswa)) {
      return NextResponse.json({ error: "ID Invalid" }, { status: 400 });
    }

    // Gunakan Transaction agar update Siswa & Ortu atomik (berhasil bareng/gagal bareng)
    await prisma.$transaction(async (tx) => {
        // 1. Update Data Siswa
        await tx.tb_siswa.update({
            where: { id_siswa: idSiswa },
            data: {
                NISN: body.NISN,
                nama_lengkap: body.nama_lengkap,
                email: body.email,
                no_hp: body.no_hp,
                alamat: body.alamat,
                tempat_lahir: body.tempat_lahir,
                tanggal_lahir: body.tanggal_lahir ? new Date(body.tanggal_lahir) : undefined,
                jenis_kelamin: body.jenis_kelamin,
                tipe_siswa: body.tipe_siswa,
                jalur_pendaftaran: body.jalur_pendaftaran,
                asal_sekolah: body.asal_sekolah,
                tahun_lulus: body.tahun_lulus ? Number(body.tahun_lulus) : undefined,
                alamat_sekolah: body.alamat_sekolah,
                ukuran_baju: body.ukuran_baju,
                anak_ke: body.anak_ke ? Number(body.anak_ke) : undefined,
                jumlah_saudara: body.jumlah_saudara ? Number(body.jumlah_saudara) : undefined,
                rt: body.rt,
                rw: body.rw,
                kode_pos: body.kode_pos
            }
        });

        // 2. Update Data Orang Tua
        // Kita gunakan updateMany karena relasi di schema prisma one-to-many
        // walaupun logic aslinya one-to-one.
        await tx.tb_orang_tua.updateMany({
            where: { id_siswa: idSiswa },
            data: {
                nama_ayah: body.nama_ayah,
                pekerjaan_ayah: body.pekerjaan_ayah,
                pendidikan_ayah: body.pendidikan_ayah,
                no_hp_orang_tua: body.no_hp_orang_tua,
                tempat_lahir_ayah: body.tempat_lahir_ayah,
                tanggal_lahir_ayah: body.tanggal_lahir_ayah ? new Date(body.tanggal_lahir_ayah) : undefined,
                penghasilan_ayah: body.penghasilan_ayah,
                
                nama_ibu: body.nama_ibu,
                pekerjaan_ibu: body.pekerjaan_ibu,
                pendidikan_ibu: body.pendidikan_ibu,
                tempat_lahir_ibu: body.tempat_lahir_ibu,
                tanggal_lahir_ibu: body.tanggal_lahir_ibu ? new Date(body.tanggal_lahir_ibu) : undefined,
                penghasilan_ibu: body.penghasilan_ibu,
            }
        });
    });

    return NextResponse.json({ message: "Data berhasil diperbarui" });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// === DELETE: HAPUS DATA (Tetap Sama) ===
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const idSiswa = Number(id);

        if (isNaN(idSiswa)) return NextResponse.json({ error: "ID Invalid" }, { status: 400 });

        const siswaTarget = await prisma.tb_siswa.findUnique({ where: { id_siswa: idSiswa } });
        if (!siswaTarget) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

        const pendaftaranTarget = await prisma.tb_pendaftaran.findFirst({ where: { nisn: siswaTarget.NISN } });

        await prisma.$transaction(async (tx) => {
            // Hapus Hilir (Siswa)
            await tx.tb_pembayaran_daftar_ulang.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_orang_tua.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_prestasi.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_dokumen.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_siswa.delete({ where: { id_siswa: idSiswa } });

            // Hapus Hulu (Pendaftaran)
            if (pendaftaranTarget) {
                const idP = pendaftaranTarget.id_pendaftar;
                await tx.tb_pembayaran_pendaftaran.deleteMany({ where: { id_pendaftaran: idP } });
                await tx.tb_prestasi_pendaftar.deleteMany({ where: { id_pendaftar: idP } });
                
                const daftarUlangList = await tx.tb_daftar_ulang.findMany({ where: { id_pendaftar: idP } });
                const idsDaftarUlang = daftarUlangList.map(d => d.id_daftar_ulang);
                if (idsDaftarUlang.length > 0) {
                    await tx.tb_pembayaran_daftar_ulang.deleteMany({ where: { id_daftar_ulang: { in: idsDaftarUlang } } });
                    await tx.tb_daftar_ulang.deleteMany({ where: { id_pendaftar: idP } });
                }
                await tx.tb_pendaftaran.delete({ where: { id_pendaftar: idP } });
            }
        });

        return NextResponse.json({ message: "Data berhasil dihapus total!" });
    } catch (error: any) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}