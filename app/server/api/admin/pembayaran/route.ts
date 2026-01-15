import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterTagihanByGender } from "@/lib/validationByGender";

export const dynamic = "force-dynamic";

// =================================================================================
// 1. GET: DATA TABEL (SORTING DATA TERBARU DI PALING ATAS)
// =================================================================================
export async function GET() {
  try {
    // Ambil data pendaftaran (urutan desc dari DB)
    const pendaftaran = await prisma.tb_pembayaran_pendaftaran.findMany({
      include: { tb_pendaftaran: true },
      orderBy: { created_at: 'desc' } 
    });

    // Ambil data daftar ulang (urutan desc dari DB)
    const daftarUlang = await prisma.tb_pembayaran_daftar_ulang.findMany({
      include: { 
        tb_jenis_pembayaran: true,
        tb_siswa: true, 
        tb_daftar_ulang: { include: { tb_pendaftaran: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const dateOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric', month: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Asia/Jakarta', hour12: false 
    };

    const combinedData = [
      ...pendaftaran.map((p: any) => ({
        id: p.id_bayar_pendaftaran,
        type: "Pendaftaran",
        NISN: p.tb_pendaftaran?.nisn || "-",
        nama_siswa: p.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        tagihan: "Biaya Pendaftaran",
        nominal_tagihan: 200000, 
        nominal: p.nominal, 
        metode: p.metode_pembayaran || "cash",
        status: p.status === 'ditolak' ? 'Rejected' : (['lunas', 'cicil'].includes(p.status) ? 'Approved' : 'Need Approval'),
        status_db: p.status,
        bukti_pembayaran: p.bukti_pembayaran, 
        tanggal_pembayaran: p.created_at ? new Date(p.created_at).toLocaleString('id-ID', dateOptions) : "-",
        // Simpan dalam format angka milidetik untuk sorting yang akurat
        raw_date: p.created_at ? new Date(p.created_at).getTime() : 0
      })),
      ...daftarUlang.map((d: any) => ({
        id: d.id_pembayaran_daftar_ulang,
        type: "DaftarUlang",
        NISN: d.tb_siswa?.NISN || d.tb_daftar_ulang?.tb_pendaftaran?.nisn || "-",
        nama_siswa: d.tb_siswa?.nama_lengkap || d.tb_daftar_ulang?.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        tagihan: d.tb_jenis_pembayaran?.nama_pembayaran || "Daftar Ulang",
        nominal_tagihan: d.tb_jenis_pembayaran?.nominal || 0,
        nominal: d.nominal, 
        metode: d.metode_pembayaran || "cash",
        status: d.status === 'ditolak' ? 'Rejected' : (['lunas', 'cicil'].includes(d.status) ? 'Approved' : 'Need Approval'),
        status_db: d.status,
        bukti_pembayaran: d.bukti_pembayaran,
        tanggal_pembayaran: d.created_at ? new Date(d.created_at).toLocaleString('id-ID', dateOptions) : "-",
        // Simpan dalam format angka milidetik untuk sorting yang akurat
        raw_date: d.created_at ? new Date(d.created_at).getTime() : 0
      }))
    ];

    // --- LOGIC UTAMA: Urutkan hasil gabungan (b - a) agar yang terbaru di index 0 ---
    combinedData.sort((a, b) => b.raw_date - a.raw_date);

    // Kirim JSON bersih tanpa field raw_date
    return NextResponse.json(combinedData.map(({ raw_date, ...item }) => item));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =================================================================================
// 2. PATCH: UPDATE STATUS (LOGIC CICILAN & GLOBAL STATUS)
// =================================================================================
export async function PATCH(request: Request) {
  try {
    const { id, type, status, id_user_admin } = await request.json();
    
    let adminRealName = "System Admin";
    if (id_user_admin) {
      const admin = await prisma.tb_users.findUnique({ where: { id_user: Number(id_user_admin) } });
      if (admin) adminRealName = admin.nama;
    }

    let nisnSiswa = "";
    let finalStatusDB = "belum";

    if (status === "Approved") {
      if (type === "Pendaftaran") {
        const trx = await prisma.tb_pembayaran_pendaftaran.findUnique({
          where: { id_bayar_pendaftaran: Number(id) },
          include: { tb_pendaftaran: true }
        });

        const masterPend = await prisma.tb_jenis_pembayaran.findFirst({
          where: { nama_pembayaran: { contains: 'Pendaftaran' } }
        });
        const hargaTagihan = masterPend ? Number(masterPend.nominal) : 199000;

        const history = await prisma.tb_pembayaran_pendaftaran.aggregate({
          where: { 
            id_pendaftaran: trx?.id_pendaftaran,
            status: { in: ['lunas', 'cicil'] },
            id_bayar_pendaftaran: { not: Number(id) } 
          },
          _sum: { nominal: true }
        });

        const totalBayar = (history._sum.nominal || 0) + Number(trx?.nominal || 0);
        finalStatusDB = totalBayar >= hargaTagihan ? "lunas" : "cicil";
        nisnSiswa = trx?.tb_pendaftaran?.nisn || "";

        await prisma.tb_pembayaran_pendaftaran.update({
          where: { id_bayar_pendaftaran: Number(id) },
          data: { status: finalStatusDB as any, approved_by: adminRealName }
        });

      } else {
        const trx = await prisma.tb_pembayaran_daftar_ulang.findUnique({
          where: { id_pembayaran_daftar_ulang: Number(id) },
          include: { tb_jenis_pembayaran: true, tb_siswa: true, tb_daftar_ulang: { include: { tb_pendaftaran: true } } }
        });

        const hargaTagihan = Number(trx?.tb_jenis_pembayaran?.nominal || 0);
        const history = await prisma.tb_pembayaran_daftar_ulang.aggregate({
          where: {
            id_daftar_ulang: trx?.id_daftar_ulang,
            id_jenis_pembayaran: trx?.id_jenis_pembayaran,
            status: { in: ['lunas', 'cicil'] },
            id_pembayaran_daftar_ulang: { not: Number(id) }
          },
          _sum: { nominal: true }
        });

        const totalBayar = (history._sum.nominal || 0) + Number(trx?.nominal || 0);
        finalStatusDB = totalBayar >= hargaTagihan ? "lunas" : "cicil";
        nisnSiswa = trx?.tb_siswa?.NISN || trx?.tb_daftar_ulang?.tb_pendaftaran?.nisn || "";

        await prisma.tb_pembayaran_daftar_ulang.update({
          where: { id_pembayaran_daftar_ulang: Number(id) },
          data: { status: finalStatusDB as any, approved_by: adminRealName }
        });
      }
    } else if (status === "Rejected") {
      if (type === "Pendaftaran") {
        await prisma.tb_pembayaran_pendaftaran.update({
          where: { id_bayar_pendaftaran: Number(id) },
          data: { status: "ditolak", approved_by: adminRealName }
        });
      } else {
        await prisma.tb_pembayaran_daftar_ulang.update({
          where: { id_pembayaran_daftar_ulang: Number(id) },
          data: { status: "ditolak", approved_by: adminRealName }
        });
      }
    }

    return NextResponse.json({ message: status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. DELETE: HAPUS DATA
export async function DELETE(request: Request) {
  try {
    const { id, type } = await request.json();
    if (type === "Pendaftaran") await prisma.tb_pembayaran_pendaftaran.delete({ where: { id_bayar_pendaftaran: Number(id) } });
    else await prisma.tb_pembayaran_daftar_ulang.delete({ where: { id_pembayaran_daftar_ulang: Number(id) } });
    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}