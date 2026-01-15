import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidTagihanForGender, filterTagihanByGender } from "@/lib/validationByGender";

// GET (TETAP SAMA)
export async function GET() {
  try {
    const pendaftaran = await prisma.tb_pembayaran_pendaftaran.findMany({
      include: { tb_pendaftaran: true },
      orderBy: { created_at: 'desc' }
    });

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
        nominal_tagihan: 200000, // Display only, gak ngaruh ke logic lunas
        nominal: p.nominal, 
        status: p.status === 'ditolak' ? 'Rejected' : (p.status === 'lunas' ? 'Approved' : 'Need Approval'),
        status_db: p.status,
        bukti_pembayaran: p.bukti_pembayaran, 
        tanggal_pembayaran: p.created_at ? new Date(p.created_at).toLocaleString('id-ID', dateOptions) : "-",
        raw_date: p.created_at ? new Date(p.created_at) : new Date(0)
      })),
      ...daftarUlang.map((d: any) => ({
        id: d.id_pembayaran_daftar_ulang,
        type: "DaftarUlang",
        NISN: d.tb_siswa?.NISN || d.tb_daftar_ulang?.tb_pendaftaran?.nisn || "-",
        nama_siswa: d.tb_siswa?.nama_lengkap || d.tb_daftar_ulang?.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        tagihan: d.tb_jenis_pembayaran?.nama_pembayaran || "Daftar Ulang",
        nominal_tagihan: d.tb_jenis_pembayaran?.nominal || 0,
        nominal: d.nominal, 
        status: d.status === 'ditolak' ? 'Rejected' : (d.status === 'lunas' ? 'Approved' : 'Need Approval'),
        status_db: d.status,
        bukti_pembayaran: d.bukti_pembayaran,
        tanggal_pembayaran: d.created_at ? new Date(d.created_at).toLocaleString('id-ID', dateOptions) : "-",
        raw_date: d.created_at ? new Date(d.created_at) : new Date(0)
      }))
    ];

    combinedData.sort((a, b) => b.raw_date.getTime() - a.raw_date.getTime());
    return NextResponse.json(combinedData.map(({ raw_date, ...item }) => item));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: LOGIC PENENTU STATUS (FIXED: HAPUS 200K HARDCODE)
export async function PATCH(request: Request) {
  try {
    const { id, type, status, id_user_admin } = await request.json();
    
    let adminRealName = "System Admin";
    if (id_user_admin) {
      const admin = await prisma.tb_users.findUnique({ where: { id_user: Number(id_user_admin) } });
      if (admin) adminRealName = admin.nama;
    }

    const targetStatus = status === "Approved" ? "lunas" : (status === "Rejected" ? "ditolak" : "belum");
    let nisnSiswa = "";
    let jenis_kelamin = "";
    let tagihan_name = "";

    // 1. Update Status Transaksi
    if (type === "Pendaftaran") {
      const updated = await prisma.tb_pembayaran_pendaftaran.update({
        where: { id_bayar_pendaftaran: Number(id) },
        data: { status: targetStatus, approved_by: adminRealName },
        include: { tb_pendaftaran: true }
      });
      nisnSiswa = updated.tb_pendaftaran?.nisn;
      jenis_kelamin = updated.tb_pendaftaran?.jenis_kelamin;
      tagihan_name = "Biaya Pendaftaran";
    } else {
      const updated = await prisma.tb_pembayaran_daftar_ulang.update({
        where: { id_pembayaran_daftar_ulang: Number(id) },
        data: { status: targetStatus, approved_by: adminRealName },
        include: { 
          tb_siswa: true,
          tb_jenis_pembayaran: true,
          tb_daftar_ulang: { include: { tb_pendaftaran: true } }
        }
      });
      nisnSiswa = updated.tb_siswa?.NISN || updated.tb_daftar_ulang?.tb_pendaftaran?.nisn;
      jenis_kelamin = updated.tb_siswa?.jenis_kelamin || updated.tb_daftar_ulang?.tb_pendaftaran?.jenis_kelamin;
      tagihan_name = updated.tb_jenis_pembayaran?.nama_pembayaran || "Daftar Ulang";

      // Validasi bahwa tagihan sesuai dengan jenis kelamin siswa
      if (jenis_kelamin && !isValidTagihanForGender(tagihan_name, jenis_kelamin)) {
        return NextResponse.json({ 
          error: `Tagihan "${tagihan_name}" tidak sesuai dengan jenis kelamin siswa (${jenis_kelamin})` 
        }, { status: 400 });
      }
    }

    // 2. LOGIKA UPDATE STATUS (FIXED)
    if (nisnSiswa) {
        console.log(`\n--- CEK STATUS (REVISI) UNTUK NISN: ${nisnSiswa} ---`);

        // A. Hitung Total Tagihan Wajib (hanya yang sesuai jenis kelamin siswa)
        const siswaData = await prisma.tb_siswa.findUnique({ where: { NISN: nisnSiswa } });
        const jenisTagihan = await prisma.tb_jenis_pembayaran.findMany({ where: { status: 'aktif' } });
        const tagihanForGender = filterTagihanByGender(jenisTagihan, siswaData?.jenis_kelamin);
        const totalTagihanWajib = tagihanForGender.reduce((acc, curr) => acc + curr.nominal, 0);
        
        console.log(`1. Total Tagihan DB: Rp ${totalTagihanWajib.toLocaleString()}`);

        // B. Hitung Uang Masuk Pendaftaran
        const pendaftaran = await prisma.tb_pembayaran_pendaftaran.findFirst({
            where: { tb_pendaftaran: { nisn: nisnSiswa }, status: 'lunas' }
        });
        const bayarPend = pendaftaran ? pendaftaran.nominal : 0;

        // C. Hitung Uang Masuk Daftar Ulang
        const daftarUlang = await prisma.tb_pembayaran_daftar_ulang.aggregate({
            where: { tb_siswa: { NISN: nisnSiswa }, status: 'lunas' },
            _sum: { nominal: true }
        });
        const bayarDU = daftarUlang._sum.nominal || 0;

        const totalBayar = bayarPend + bayarDU;
        console.log(`2. Total Bayar (Pend+DU): Rp ${totalBayar.toLocaleString()}`);

        // D. Tentukan Status
        // Kita pakai toleransi >= karena mungkin ada kelebihan bayar sedikit
        const statusAkhir = totalBayar >= totalTagihanWajib ? 'lunas' : 'belum_lunas';
        
        console.log(`3. Hasil: ${totalBayar} >= ${totalTagihanWajib} ? ${statusAkhir.toUpperCase()}`);

        // E. Update Database
        await prisma.tb_siswa.update({
            where: { NISN: nisnSiswa },
            data: { status_pembayaran: statusAkhir }
        });
    }

    const msg = status === "Approved" ? `Disetujui oleh ${adminRealName}` : `Ditolak`;
    return NextResponse.json({ message: msg });
  } catch (error: any) {
    console.error("ERROR PATCH:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE (Tetap)
export async function DELETE(request: Request) {
  try {
    const { id, type } = await request.json();
    if (type === "Pendaftaran") await prisma.tb_pembayaran_pendaftaran.delete({ where: { id_bayar_pendaftaran: Number(id) } });
    else await prisma.tb_pembayaran_daftar_ulang.delete({ where: { id_pembayaran_daftar_ulang: Number(id) } });
    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}