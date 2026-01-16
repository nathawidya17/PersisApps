import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterTagihanByGender } from "@/lib/validationByGender";

export const dynamic = "force-dynamic";

// --- HELPER FUNCTIONS ---

// 1. safeDate: Mengembalikan undefined jika kosong
function safeDate(dateString: any) {
  if (!dateString || dateString === "" || dateString === "null") return undefined;
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? undefined : d;
}

// 2. safeInt: Mengembalikan undefined jika kosong (SOLUSI ERROR SCREENSHOT 2)
function safeInt(numberString: any) {
  if (!numberString || numberString === "") return undefined;
  // Hapus karakter non-angka
  const cleanNum = String(numberString).replace(/[^0-9]/g, '');
  const n = parseInt(cleanNum);
  return isNaN(n) ? undefined : n;
}

// 3. safeString: Mengembalikan undefined jika kosong
function safeString(text: any) {
  if (text === "" || text === undefined || text === null) return undefined;
  return String(text);
}

// 4. fixGender: Mapping Laki-laki -> Laki_laki (Sesuai Enum Prisma)
function fixGender(gender: any) {
  if (!gender) return undefined;
  const g = String(gender).toLowerCase();
  
  // Mapping ke ENUM Prisma (Laki_laki atau Perempuan)
  if (g.includes("laki") || g === "l") return "Laki_laki"; 
  if (g.includes("perempuan") || g === "p") return "Perempuan"; 
  
  return undefined;
}

// 5. fixUkuranBaju: Validasi Enum Ukuran Baju (SOLUSI ERROR SCREENSHOT 3)
function fixUkuranBaju(size: any) {
  if (!size) return undefined;
  const s = String(size).toUpperCase(); // Paksa jadi huruf besar (xl -> XL)
  
  // Cek apakah input sesuai dengan opsi Enum di Database
  const validSizes = ["S", "M", "L", "XL", "XXL"];
  if (validSizes.includes(s)) {
    return s as "S" | "M" | "L" | "XL" | "XXL"; // Type casting agar TS happy
  }
  
  return undefined;
}

// === 1. GET: DETAIL DATA ===
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const idSiswa = Number(id);
    
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
          jenis_kelamin: pendaftar.jenis_kelamin === "Laki_laki" ? "Laki-laki" : "Perempuan",
          email: pendaftar.email,
          no_hp: pendaftar.no_hp,
          tb_pembayaran_pendaftaran: pendaftar.tb_pembayaran_pendaftaran,
          isPendaftar: true 
        }
      });
    }

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
        jenis_kelamin: siswa.jenis_kelamin === "Laki_laki" ? "Laki-laki" : "Perempuan",
        
        nama_ayah: siswa.tb_orang_tua[0]?.nama_ayah || "",
        pekerjaan_ayah: siswa.tb_orang_tua[0]?.pekerjaan_ayah || "",
        pendidikan_ayah: siswa.tb_orang_tua[0]?.pendidikan_ayah || "",
        penghasilan_ayah: siswa.tb_orang_tua[0]?.penghasilan_ayah || "",
        tempat_lahir_ayah: siswa.tb_orang_tua[0]?.tempat_lahir_ayah || "",
        tanggal_lahir_ayah: siswa.tb_orang_tua[0]?.tanggal_lahir_ayah || null,
        
        nama_ibu: siswa.tb_orang_tua[0]?.nama_ibu || "",
        pekerjaan_ibu: siswa.tb_orang_tua[0]?.pekerjaan_ibu || "",
        pendidikan_ibu: siswa.tb_orang_tua[0]?.pendidikan_ibu || "",
        penghasilan_ibu: siswa.tb_orang_tua[0]?.penghasilan_ibu || "",
        tempat_lahir_ibu: siswa.tb_orang_tua[0]?.tempat_lahir_ibu || "",
        tanggal_lahir_ibu: siswa.tb_orang_tua[0]?.tanggal_lahir_ibu || null,
        
        no_hp_orang_tua: siswa.tb_orang_tua[0]?.no_hp_orang_tua || "",
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

// === 2. PUT: UPDATE DATA ===
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const idSiswa = Number(id);
    
    if (isNaN(idSiswa)) {
      return NextResponse.json({ error: "ID Invalid" }, { status: 400 });
    }

    const body = await req.json();
    console.log("Update Data untuk ID:", idSiswa);

    await prisma.$transaction(async (tx) => {
        // 1. Update Data Siswa
        await tx.tb_siswa.update({
            where: { id_siswa: idSiswa },
            data: {
                nama_lengkap: body.nama_lengkap,
                
                // FIX: Gender Laki-laki -> Laki_laki
                jenis_kelamin: fixGender(body.jenis_kelamin), 
                
                NISN: safeString(body.NISN),
                email: safeString(body.email),
                no_hp: safeString(body.no_hp),
                
                nik: safeString(body.nik),
                no_kk: safeString(body.no_kk),
                anak_ke: safeInt(body.anak_ke),            // Int (Undefined jika kosong)
                jumlah_saudara: safeInt(body.jumlah_saudara), // Int (Undefined jika kosong)
                
                alamat: safeString(body.alamat),
                rt: safeString(body.rt),
                rw: safeString(body.rw),
                kode_pos: safeString(body.kode_pos),
                
                tempat_lahir: safeString(body.tempat_lahir),
                tanggal_lahir: safeDate(body.tanggal_lahir),
                
                asal_sekolah: safeString(body.asal_sekolah),
                alamat_sekolah: safeString(body.alamat_sekolah),
                tahun_lulus: safeInt(body.tahun_lulus),         // Int
                kode_pos_sekolah: safeInt(body.kode_pos_sekolah), // Int
                
                // FIX: Ukuran Baju String -> Enum
                ukuran_baju: fixUkuranBaju(body.ukuran_baju), 
                
                jumlah_hafalan: safeString(body.jumlah_hafalan),
            }
        });

        // 2. Update Data Orang Tua
        const ortuExist = await tx.tb_orang_tua.findFirst({ where: { id_siswa: idSiswa } });
        
        if (ortuExist) {
          await tx.tb_orang_tua.updateMany({
              where: { id_siswa: idSiswa },
              data: {
                  nama_ayah: safeString(body.nama_ayah),
                  tempat_lahir_ayah: safeString(body.tempat_lahir_ayah),
                  tanggal_lahir_ayah: safeDate(body.tanggal_lahir_ayah),
                  pekerjaan_ayah: safeString(body.pekerjaan_ayah),
                  pendidikan_ayah: safeString(body.pendidikan_ayah),
                  penghasilan_ayah: safeString(body.penghasilan_ayah),
                  
                  nama_ibu: safeString(body.nama_ibu),
                  tempat_lahir_ibu: safeString(body.tempat_lahir_ibu),
                  tanggal_lahir_ibu: safeDate(body.tanggal_lahir_ibu),
                  pekerjaan_ibu: safeString(body.pekerjaan_ibu),
                  pendidikan_ibu: safeString(body.pendidikan_ibu),
                  penghasilan_ibu: safeString(body.penghasilan_ibu),
                  
                  no_hp_orang_tua: safeString(body.no_hp_orang_tua)
              }
          });
        }
    });

    return NextResponse.json({ message: "Data berhasil diperbarui" });
  } catch (error: any) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// === 3. DELETE: HAPUS DATA ===
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const idSiswa = Number(id);

        if (isNaN(idSiswa)) return NextResponse.json({ error: "ID Invalid" }, { status: 400 });

        const siswaTarget = await prisma.tb_siswa.findUnique({ where: { id_siswa: idSiswa } });
        if (!siswaTarget) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

        const pendaftaranTarget = await prisma.tb_pendaftaran.findFirst({ where: { nisn: siswaTarget.NISN } });

        await prisma.$transaction(async (tx) => {
            // Hapus relasi berurutan
            await tx.tb_pembayaran_daftar_ulang.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_orang_tua.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_prestasi.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_dokumen.deleteMany({ where: { id_siswa: idSiswa } });
            await tx.tb_siswa.delete({ where: { id_siswa: idSiswa } });

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