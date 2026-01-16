import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Ambil Data Pendaftaran
    const pendaftaran = await prisma.tb_pembayaran_pendaftaran.findMany({
      include: { tb_pendaftaran: true },
      orderBy: { created_at: 'desc' }
    });

    // 2. Ambil Data Daftar Ulang
    const daftarUlang = await prisma.tb_pembayaran_daftar_ulang.findMany({
      include: { 
        tb_jenis_pembayaran: true, 
        tb_siswa: true, 
        tb_daftar_ulang: { include: { tb_pendaftaran: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    // 3. Mapping Awal (Flat Data)
    const allTransactions = [
      // --- MAP PENDAFTARAN (FIXED: Tambah nominal_fix) ---
      ...pendaftaran.map((p: any) => ({
        id: p.id_bayar_pendaftaran,
        nisn: p.tb_pendaftaran?.nisn || "UNKNOWN",
        nama_siswa: p.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
        item: "Biaya Pendaftaran",
        
        nominal_db: Number(p.nominal), 
        nominal_fix: Number(p.nominal), // <--- DITAMBAHKAN AGAR TYPE SAMA
        
        status: p.status,
        date: p.created_at,
        metode: p.metode_pembayaran || "cash",
        bukti: p.bukti_pembayaran
      })),
      
      // --- MAP DAFTAR ULANG ---
      ...daftarUlang.map((d: any) => {
        const hargaMaster = Number(d.tb_jenis_pembayaran?.nominal || 0);
        let nominalItem = Number(d.nominal);

        // LOGIC FIX HARGA (Anti-Bug 4 Juta jadi 1 Juta)
        if (['lunas', 'cicil'].includes(d.status) && hargaMaster > 0 && nominalItem > hargaMaster * 1.5) {
             nominalItem = hargaMaster;
        }

        return {
            id: d.id_pembayaran_daftar_ulang,
            nisn: d.tb_siswa?.NISN || d.tb_daftar_ulang?.tb_pendaftaran?.nisn || "UNKNOWN",
            nama_siswa: d.tb_siswa?.nama_lengkap || d.tb_daftar_ulang?.tb_pendaftaran?.nama_lengkap || "Tanpa Nama",
            item: d.tb_jenis_pembayaran?.nama_pembayaran || "Item",
            
            nominal_db: Number(d.nominal), 
            nominal_fix: nominalItem,      
            
            status: d.status,
            date: d.created_at,
            metode: d.metode_pembayaran || "cash",
            bukti: d.bukti_pembayaran
        };
      })
    ];

    // 4. GROUPING LOGIC
    const groups: any = {};

    allTransactions.forEach((trx: any) => { // Tambahkan type any biar aman
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
                raw_nominals: [],
                jumlah_item: 0,
                status_summary: [],
                items_detail: [] 
            };
        }

        groups[groupKey].raw_nominals.push(trx.nominal_db);
        groups[groupKey].jumlah_item += 1;
        groups[groupKey].status_summary.push(trx.status);
        
        // Push rincian item (Sekarang aman karena nominal_fix ada di semua tipe)
        groups[groupKey].items_detail.push({
            name: trx.item,
            nominal: trx.nominal_fix, 
            status: trx.status
        });
    });

    // 5. Format Output
    const result = Object.values(groups).map((g: any) => {
        
        // --- LOGIC TOTAL TRANSAKSI YANG BENAR ---
        let finalTotal = 0;
        const nominals = g.raw_nominals;

        if (nominals.length > 1) {
            // Cek apakah semua nominal sama persis (Ciri khas bug duplikat)
            const allSame = nominals.every((n: number) => n === nominals[0]);
            
            if (allSame) {
                finalTotal = nominals[0]; // Ambil satu saja (Contoh: 1 Juta)
            } else {
                finalTotal = nominals.reduce((acc: number, val: number) => acc + val, 0);
            }
        } else {
            finalTotal = nominals[0];
        }

        // Logic Status
        const rawStatuses = g.status_summary;
        let finalVerif = "NEED APPROVAL";
        if (rawStatuses.includes('ditolak')) finalVerif = "Rejected"; 
        else if (rawStatuses.some((s: string) => s === 'belum' || s === 'menunggu')) finalVerif = "NEED APPROVAL";
        else finalVerif = "Approved";

        let finalPay = "Belum";
        if (rawStatuses.includes('cicil')) finalPay = "Cicil";
        else if (rawStatuses.includes('lunas')) finalPay = "Lunas";

        const listItems = g.items_detail.map((i: any) => i.name).join(", ");

        return {
            group_id: g.group_id,
            nisn: g.nisn,
            nama_siswa: g.nama_siswa,
            date: g.date,
            total_nominal: finalTotal, 
            jumlah_item: g.jumlah_item,
            list_items: listItems,
            items_detail: g.items_detail,
            status: finalVerif,
            status_pembayaran: finalPay,
            metode: "transfer",
            bukti_utama: null 
        };
    });

    result.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}