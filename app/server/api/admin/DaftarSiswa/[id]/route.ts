import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeGender } from "@/lib/gender";
import { filterTagihanByGender } from "@/lib/validationByGender";

export const dynamic = "force-dynamic";

// === 1. GET: DETAIL DATA (TIDAK BERUBAH DARI LOGIC TERAKHIR) ===
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const idSiswa = Number(id);
    
    // Cari di tb_siswa dulu
    let siswa = await prisma.tb_siswa.findFirst({
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
        tb_pembayaran_daftar_ulang: { include: { tb_jenis_pembayaran: true } }
      }
    });

    // Kalo di tb_siswa gak ada, cari di tb_pendaftaran (Biar pendaftar baru bisa keload namanya)
    if (!siswa) {
      const pendaftar = await prisma.tb_pendaftaran.findFirst({
        where: { nisn: id },
        include: { 
          tb_pembayaran_pendaftaran: true,
          tb_prestasi_pendaftar: true 
        }
      });

      if (!pendaftar) {
        return NextResponse.json({ error: "Data tidak ditemukan di sistem" }, { status: 404 });
      }

      return NextResponse.json({ 
        detailSiswa: {
          nama_lengkap: pendaftar.nama_lengkap,
          NISN: pendaftar.nisn,
          jenis_kelamin: pendaftar.jenis_kelamin,
          email: pendaftar.email,
          no_hp: pendaftar.no_hp,
          tb_pembayaran_pendaftaran: pendaftar.tb_pembayaran_pendaftaran,
          isPendaftar: true 
        }
      });
    }

    // Ambil history pendaftaran via NISN
    const pendaftaran = await prisma.tb_pendaftaran.findFirst({
        where: { nisn: siswa.NISN }
    });

    let historyPendaftaran: any[] = [];
    if (pendaftaran) {
        historyPendaftaran = await prisma.tb_pembayaran_pendaftaran.findMany({
            where: { id_pendaftaran: pendaftaran.id_pendaftar }
        });
    }

    const finalData = {
        ...siswa,
        nama_ayah: siswa.tb_orang_tua[0]?.nama_ayah || "",
        pekerjaan_ayah: siswa.tb_orang_tua[0]?.pekerjaan_ayah || "",
        pendidikan_ayah: siswa.tb_orang_tua[0]?.pendidikan_ayah || "",
        no_hp_orang_tua: siswa.tb_orang_tua[0]?.no_hp_orang_tua || "",
        nama_ibu: siswa.tb_orang_tua[0]?.nama_ibu || "",
        pekerjaan_ibu: siswa.tb_orang_tua[0]?.pekerjaan_ibu || "",
        pendidikan_ibu: siswa.tb_orang_tua[0]?.pendidikan_ibu || "",
        tb_pembayaran_pendaftaran: historyPendaftaran, 
        tb_pembayaran_daftar_ulang: siswa.tb_pembayaran_daftar_ulang
    };

    const jenisTagihan = await prisma.tb_jenis_pembayaran.findMany({ where: { status: 'aktif' } });
    const jenisTagihanFiltered = filterTagihanByGender(jenisTagihan, siswa.jenis_kelamin);

    return NextResponse.json({ detailSiswa: finalData, jenisTagihan: jenisTagihanFiltered });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// === 2. PUT: UPDATE DATA (TIDAK BERUBAH) ===
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const idSiswa = Number(id);
    const body = await req.json();

    if (isNaN(idSiswa)) return NextResponse.json({ error: "ID Invalid" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
        await tx.tb_siswa.update({
            where: { id_siswa: idSiswa },
            data: {
                NISN: body.NISN,
                nama_lengkap: body.nama_lengkap,
                email: body.email,
                no_hp: body.no_hp,
                alamat: body.alamat,
                jenis_kelamin: normalizeGender(body.jenis_kelamin) || body.jenis_kelamin,
                jumlah_hafalan: body.jumlah_hafalan || null
            }
        });

        await tx.tb_orang_tua.updateMany({
            where: { id_siswa: idSiswa },
            data: {
                nama_ayah: body.nama_ayah,
                nama_ibu: body.nama_ibu,
                no_hp_orang_tua: body.no_hp_orang_tua
            }
        });
    });

    return NextResponse.json({ message: "Data berhasil diperbarui" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// === 3. DELETE: HAPUS DATA (BALIKAN LAGI BIAR GAK ERROR 405) ===
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const idSiswa = Number(id);

        if (isNaN(idSiswa)) return NextResponse.json({ error: "ID Invalid" }, { status: 400 });

        const siswaTarget = await prisma.tb_siswa.findUnique({ where: { id_siswa: idSiswa } });
        if (!siswaTarget) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

        const pendaftaranTarget = await prisma.tb_pendaftaran.findFirst({ where: { nisn: siswaTarget.NISN } });

        await prisma.$transaction(async (tx) => {
            // Hapus semua relasi Siswa
            await tx.tb_pembayaran_daftar_ulang.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_orang_tua.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_prestasi.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_dokumen.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_siswa.delete({ where: { id_siswa: idSiswa } });

            // Hapus data Pendaftaran (jika ada)
            if (pendaftaranTarget) {
                const idP = pendaftaranTarget.id_pendaftar;
                await tx.tb_pembayaran_pendaftaran.deleteMany({ where: { id_pendaftaran: idP } });
                await tx.tb_prestasi_pendaftar.deleteMany({ where: { id_pendaftar: idP } });
                
                const duList = await tx.tb_daftar_ulang.findMany({ where: { id_pendaftar: idP } });
                const idsDU = duList.map(d => d.id_daftar_ulang);
                if (idsDU.length > 0) {
                    await tx.tb_pembayaran_daftar_ulang.deleteMany({ where: { id_daftar_ulang: { in: idsDU } } });
                    await tx.tb_daftar_ulang.deleteMany({ where: { id_pendaftar: idP } });
                }
                await tx.tb_pendaftaran.delete({ where: { id_pendaftar: idP } });
            }
        });

        return NextResponse.json({ message: "Data berhasil dihapus total!" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}