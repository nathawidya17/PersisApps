import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Ambil Semua Data Pembayaran
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

    // 2. Gabungkan Data & Siapkan Field Nominal Asli
    const allTransactions = [
      ...pendaftaran.map((p: any) => {
        const nominalDB = Number(p.nominal);
        const hargaTarget = 199000; // FIX: Target Pendaftaran 199rb

        // LOGIC FIX: Jika status di DB 'cicil' tapi uangnya >= 199.000, anggap 'lunas'
        let realStatus = p.status;
        if (p.status === 'cicil' && nominalDB >= hargaTarget) {
            realStatus = 'lunas';
        }

        return {
            id: p.id_bayar_pendaftaran,
            type: "Pendaftaran",
            nisn: p.tb_pendaftaran?.nisn || "UNKNOWN",
            nama_siswa: p.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
            item: "Biaya Pendaftaran",
            
            nominal_db: nominalDB,
            nominal_asli: hargaTarget, 

            status: realStatus, // Status yang sudah diperbaiki
            date: p.created_at,
            metode: p.metode_pembayaran || "cash",
            bukti: p.bukti_pembayaran
        };
      }),
      
      ...daftarUlang.map((d: any) => {
        const nominalDB = Number(d.nominal);
        const hargaMaster = Number(d.tb_jenis_pembayaran?.nominal || 0);
        
        let realStatus = d.status;
        // Toleransi selisih sedikit, anggap lunas
        if (d.status === 'cicil' && hargaMaster > 0 && nominalDB >= hargaMaster) {
            realStatus = 'lunas';
        }

        return {
            id: d.id_pembayaran_daftar_ulang,
            type: "DaftarUlang",
            nisn: d.tb_siswa?.NISN || d.tb_daftar_ulang?.tb_pendaftaran?.nisn || "UNKNOWN",
            nama_siswa: d.tb_siswa?.nama_lengkap || d.tb_daftar_ulang?.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
            item: d.tb_jenis_pembayaran?.nama_pembayaran || "Item",
            
            nominal_db: nominalDB,
            nominal_asli: hargaMaster,

            status: realStatus,
            date: d.created_at,
            metode: d.metode_pembayaran || "cash",
            bukti: d.bukti_pembayaran
        };
      })
    ];

    // 3. GROUPING LOGIC (NISN + Menit yang sama)
    const groups: any = {};

    allTransactions.forEach(trx => {
        if (!trx.date) return;
        
        const dateObj = new Date(trx.date);
        const timeKey = dateObj.toISOString().slice(0, 16); 
        const groupKey = `${trx.nisn}_${timeKey}`;

        if (!groups[groupKey]) {
            groups[groupKey] = {
                group_id: groupKey,
                nisn: trx.nisn,
                nama_siswa: trx.nama_siswa,
                date: trx.date,
                total_nominal: 0,
                jumlah_item: 0,
                status_summary: [],
                items: [] 
            };
        }

        groups[groupKey].jumlah_item += 1;
        // Push status yang SUDAH DIPERBAIKI ke summary
        groups[groupKey].status_summary.push(trx.status);
        groups[groupKey].items.push(trx);
    });

    // 4. Format Output List & FIX NOMINAL BUG
    const result = Object.values(groups).map((g: any) => {
        const items = g.items;
        
        // --- LOGIC PERBAIKAN TOTAL BAYAR (BUG TOTAL) ---
        const sumStored = items.reduce((acc: number, curr: any) => acc + curr.nominal_db, 0);
        const sumMaster = items.reduce((acc: number, curr: any) => acc + curr.nominal_asli, 0);
        
        const firstNominal = items[0].nominal_db;
        const allNominalsAreSame = items.every((i: any) => i.nominal_db === firstNominal);

        if (items.length > 1 && allNominalsAreSame && sumStored > sumMaster) {
             g.total_nominal = firstNominal; 
        } else {
             g.total_nominal = sumStored;
        }

        // --- Logic Status Verifikasi ---
        const rawStatuses = g.status_summary;
        let finalVerifStatus = "NEED APPROVAL";
        const isPending = rawStatuses.some((s: string) => s === 'belum' || s === 'menunggu');
        const isRejected = rawStatuses.some((s: string) => s === 'ditolak' || s === 'Rejected');

        if (isPending) finalVerifStatus = "NEED APPROVAL";
        else if (isRejected) finalVerifStatus = "Rejected";
        else finalVerifStatus = "Approved";

        // --- Logic Lunas/Cicil ---
        let finalPaymentStatus = "Belum";
        
        // Prioritas: Jika ada cicil, maka Cicil. Jika semua Lunas, maka Lunas.
        if (rawStatuses.includes('cicil')) {
            finalPaymentStatus = "Cicil";
        } else if (rawStatuses.every((s: string) => s === 'lunas')) {
            finalPaymentStatus = "Lunas";
        } else if (rawStatuses.includes('lunas')) {
            finalPaymentStatus = "Cicil"; // Campuran
        }

        const listItems = g.items.map((i: any) => i.item).join(", ");

        return {
            group_id: g.group_id,
            nisn: g.nisn,
            nama_siswa: g.nama_siswa,
            date: g.date,
            
            // Output Final
            total_nominal: g.total_nominal, 
            jumlah_item: g.jumlah_item,
            list_items: listItems, 
            status: finalVerifStatus,
            status_pembayaran: finalPaymentStatus,
            
            metode: g.items[0]?.metode || "cash", 
            bukti_utama: g.items[0]?.bukti || null 
        };
    });

    // Sorting Terbaru
    result.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}