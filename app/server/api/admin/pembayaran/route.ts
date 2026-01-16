import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// =================================================================================
// 1. GET: DATA TABEL (FIXED: VARIABEL MATCHING DENGAN FRONTEND)
// =================================================================================
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
        group_id: `PEND-${p.id_bayar_pendaftaran}`,
        NISN: p.tb_pendaftaran?.nisn || "-",
        nama_siswa: p.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        tagihan: "Biaya Pendaftaran",
        list_items: "Biaya Pendaftaran", 
        jumlah_item: 1,
        
        // --- PERBAIKAN UTAMA DISINI ---
        // Frontend minta 'total_nominal', Backend DB punya 'nominal'
        total_nominal: Number(p.nominal || 0), 
        
        metode: p.metode_pembayaran || "cash",
        
        // Status Verifikasi (Approved/Need Approval)
        status: p.status === 'ditolak' ? 'Rejected' : (['lunas', 'cicil'].includes(p.status) ? 'Approved' : 'Need Approval'),
        
        // --- PERBAIKAN UTAMA DISINI ---
        // Frontend minta 'status_pembayaran', Backend DB punya 'status'
        // Kita kirim string 'Lunas', 'Cicil', atau 'Belum'
        status_pembayaran: (p.status === 'lunas' || p.status === 'cicil') ? p.status : "Belum",
        
        bukti_pembayaran: p.bukti_pembayaran, 
        date: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
        raw_date: p.created_at ? new Date(p.created_at).getTime() : 0
      })),
      
      ...daftarUlang.map((d: any) => ({
        id: d.id_pembayaran_daftar_ulang,
        type: "DaftarUlang",
        group_id: `DU-${d.id_pembayaran_daftar_ulang}`,
        NISN: d.tb_siswa?.NISN || d.tb_daftar_ulang?.tb_pendaftaran?.nisn || "-",
        nama_siswa: d.tb_siswa?.nama_lengkap || d.tb_daftar_ulang?.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        tagihan: d.tb_jenis_pembayaran?.nama_pembayaran || "Daftar Ulang",
        list_items: d.tb_jenis_pembayaran?.nama_pembayaran || "Daftar Ulang",
        jumlah_item: 1,

        // --- PERBAIKAN UTAMA DISINI ---
        total_nominal: Number(d.nominal || 0), 
        
        metode: d.metode_pembayaran || "cash",
        
        status: d.status === 'ditolak' ? 'Rejected' : (['lunas', 'cicil'].includes(d.status) ? 'Approved' : 'Need Approval'),
        
        // --- PERBAIKAN UTAMA DISINI ---
        status_pembayaran: (d.status === 'lunas' || d.status === 'cicil') ? d.status : "Belum",
        
        bukti_pembayaran: d.bukti_pembayaran,
        date: d.created_at ? d.created_at.toISOString() : new Date().toISOString(),
        raw_date: d.created_at ? new Date(d.created_at).getTime() : 0
      }))
    ];

    // Urutkan Terbaru
    combinedData.sort((a, b) => b.raw_date - a.raw_date);

    return NextResponse.json(combinedData.map(({ raw_date, ...item }) => item));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =================================================================================
// 2. PATCH: UPDATE STATUS
// =================================================================================
export async function PATCH(request: Request) {
  try {
    const { id, type, status, id_user_admin } = await request.json();
    
    let adminRealName = "System Admin";
    if (id_user_admin) {
      const admin = await prisma.tb_users.findUnique({ where: { id_user: Number(id_user_admin) } });
      if (admin) adminRealName = admin.nama;
    }

    let finalStatusDB = "belum";

    if (status === "Approved") {
      if (type === "Pendaftaran") {
        const trx = await prisma.tb_pembayaran_pendaftaran.findUnique({
          where: { id_bayar_pendaftaran: Number(id) },
          include: { tb_pendaftaran: true }
        });

        const hargaTagihan = 200000; 

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

        await prisma.tb_pembayaran_pendaftaran.update({
          where: { id_bayar_pendaftaran: Number(id) },
          data: { status: finalStatusDB as any, approved_by: adminRealName }
        });

      } else {
        const trx = await prisma.tb_pembayaran_daftar_ulang.findUnique({
          where: { id_pembayaran_daftar_ulang: Number(id) },
          include: { tb_jenis_pembayaran: true }
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

        await prisma.tb_pembayaran_daftar_ulang.update({
          where: { id_pembayaran_daftar_ulang: Number(id) },
          data: { status: finalStatusDB as any, approved_by: adminRealName }
        });
      }
    } else if (status === "Rejected") {
      const updateData = { status: "ditolak", approved_by: adminRealName };
      
      if (type === "Pendaftaran") {
        await prisma.tb_pembayaran_pendaftaran.update({
          where: { id_bayar_pendaftaran: Number(id) },
          data: updateData as any
        });
      } else {
        await prisma.tb_pembayaran_daftar_ulang.update({
          where: { id_pembayaran_daftar_ulang: Number(id) },
          data: updateData as any
        });
      }
    }

    return NextResponse.json({ message: status, status_db: finalStatusDB });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. DELETE
export async function DELETE(request: Request) {
  try {
    const { id, type } = await request.json();
    if (type === "Pendaftaran") await prisma.tb_pembayaran_pendaftaran.delete({ where: { id_bayar_pendaftaran: Number(id) } });
    else await prisma.tb_pembayaran_daftar_ulang.delete({ where: { id_pembayaran_daftar_ulang: Number(id) } });
    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}