import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// --- HELPER: FUNGSI HITUNG ULANG STATUS SISWA ---
// Fungsi ini akan dipanggil setiap kali ada perubahan data pembayaran
async function recalculateStudentStatus(nisn: string | null, id_siswa: number | null) {
  if (!nisn && !id_siswa) return;

  // 1. Cari Siswa untuk dapatkan ID dan NISN yang lengkap
  const siswa = await prisma.tb_siswa.findFirst({
    where: {
      OR: [
        { id_siswa: id_siswa || 0 },
        { NISN: nisn || "" }
      ]
    }
  });

  if (!siswa) return;

  // 2. Hitung TARGET TAGIHAN (Dinamis: Mengambil semua tagihan AKTIF)
  const jenisTagihan = await prisma.tb_jenis_pembayaran.findMany({ where: { status: 'aktif' } });
  const TARGET_TAGIHAN = 200000 + jenisTagihan.reduce((total, item) => total + item.nominal, 0);

  // 3. Hitung TOTAL UANG MASUK (Hanya yang statusnya 'lunas')
  
  // A. Dari Pendaftaran
  const bayarPend = await prisma.tb_pembayaran_pendaftaran.aggregate({
    _sum: { nominal: true },
    where: {
      status: 'lunas',
      tb_pendaftaran: { nisn: siswa.NISN }
    }
  });

  // B. Dari Daftar Ulang
  const bayarDU = await prisma.tb_pembayaran_daftar_ulang.aggregate({
    _sum: { nominal: true },
    where: {
      status: 'lunas',
      id_siswa: siswa.id_siswa
    }
  });

  const totalMasuk = (bayarPend._sum.nominal || 0) + (bayarDU._sum.nominal || 0);

  // 4. Update Status Siswa (Real-time Comparison)
  const statusFinal = totalMasuk >= TARGET_TAGIHAN ? 'lunas' : 'belum_lunas';

  // Hanya update database jika statusnya berbeda (biar hemat resource)
  if (siswa.status_pembayaran !== statusFinal) {
    await prisma.tb_siswa.update({
      where: { id_siswa: siswa.id_siswa },
      data: { status_pembayaran: statusFinal }
    });
  }
}


// --- GET METHOD (Tidak Berubah) ---
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
        nominal_tagihan: 200000, 
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

// --- PATCH METHOD (Update Status & Recalculate) ---
export async function PATCH(request: Request) {
  try {
    const { id, type, status, id_user_admin } = await request.json();
    
    let adminName = "Admin";
    if(id_user_admin) {
        const u = await prisma.tb_users.findUnique({where: {id_user: Number(id_user_admin)}});
        if(u) adminName = u.nama;
    }

    const targetStatus = status === "Approved" ? "lunas" : (status === "Rejected" ? "ditolak" : "belum");
    
    // Variabel untuk menyimpan identitas siswa agar bisa dihitung ulang
    let nisn = null;
    let id_siswa = null;

    if (type === "Pendaftaran") {
      const updated = await prisma.tb_pembayaran_pendaftaran.update({
        where: { id_bayar_pendaftaran: Number(id) },
        data: { status: targetStatus, approved_by: adminName },
        include: { tb_pendaftaran: true }
      });
      nisn = updated.tb_pendaftaran?.nisn;
    } else {
      const updated = await prisma.tb_pembayaran_daftar_ulang.update({
        where: { id_pembayaran_daftar_ulang: Number(id) },
        data: { status: targetStatus, approved_by: adminName },
        include: { tb_siswa: true }
      });
      id_siswa = updated.id_siswa;
      nisn = updated.tb_siswa?.NISN || null;
    }

    // TRIGGER RECALCULATE
    await recalculateStudentStatus(nisn, id_siswa);

    return NextResponse.json({ message: "Updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE METHOD (Delete & Recalculate) ---
export async function DELETE(request: Request) {
    try {
        const { id, type } = await request.json();
        
        let nisn = null;
        let id_siswa = null;

        // 1. Ambil Data Dulu Sebelum Dihapus (Supaya tau siapa yang punya)
        if (type === "Pendaftaran") {
            const data = await prisma.tb_pembayaran_pendaftaran.findUnique({
                where: { id_bayar_pendaftaran: Number(id) },
                include: { tb_pendaftaran: true }
            });
            if(data) nisn = data.tb_pendaftaran?.nisn;
            
            // Hapus Data
            await prisma.tb_pembayaran_pendaftaran.delete({ where: { id_bayar_pendaftaran: Number(id) } });

        } else {
            const data = await prisma.tb_pembayaran_daftar_ulang.findUnique({
                where: { id_pembayaran_daftar_ulang: Number(id) },
                include: { tb_siswa: true }
            });
            if(data) {
                id_siswa = data.id_siswa;
                nisn = data.tb_siswa?.NISN || null;
            }

            // Hapus Data
            await prisma.tb_pembayaran_daftar_ulang.delete({ where: { id_pembayaran_daftar_ulang: Number(id) } });
        }

        // 2. TRIGGER RECALCULATE SETELAH HAPUS
        // Jika tadinya LUNAS, lalu satu pembayaran dihapus, maka fungsi ini akan mendeteksi uang kurang dan mengubah jadi BELUM LUNAS.
        await recalculateStudentStatus(nisn, id_siswa);

        return NextResponse.json({ message: "Deleted" });
    } catch(e:any){ 
        return NextResponse.json({error:e.message},{status:500}); 
    }
}