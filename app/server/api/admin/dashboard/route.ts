import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const endWeek = endOfWeek(new Date(), { weekStartsOn: 1 });

    // --- 1. DATA CARD ATAS ---
    const [totalP, totalDU, totalResmi, hariIni] = await Promise.all([
      prisma.tb_pendaftaran.count(),
      prisma.tb_daftar_ulang.count(),
      prisma.tb_siswa.count(),
      prisma.tb_pendaftaran.count({ where: { created_at: { gte: today } } }),
    ]);

    // --- 2. DATA CHART (MINGGUAN) ---
    const days = eachDayOfInterval({ start: startWeek, end: endWeek });
    const weeklyChart = await Promise.all(days.map(async (day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const countP = await prisma.tb_pendaftaran.count({ where: { created_at: { gte: day, lt: nextDay } } });
      const countDU = await prisma.tb_daftar_ulang.count({ where: { created_at: { gte: day, lt: nextDay } } });
      
      const moneyP = await prisma.tb_pembayaran_pendaftaran.aggregate({
        where: { tanggal_bayar: { gte: day, lt: nextDay } },
        _sum: { nominal: true }
      });
      const moneyDU = await prisma.tb_pembayaran_daftar_ulang.aggregate({
        where: { tanggal_bayar: { gte: day, lt: nextDay } },
        _sum: { nominal: true }
      });

      return {
        name: format(day, "EEEE"),
        pendaftar: countP,
        calonSiswa: countDU,
        uangPendaftaran: moneyP._sum.nominal || 0,
        uangDaftarUlang: moneyDU._sum.nominal || 0,
      };
    }));

    // --- 3. PIE CHART JENIS KELAMIN ---
    const genderData = await prisma.tb_siswa.groupBy({
      by: ['jenis_kelamin'],
      _count: true,
    });

    // --- 4. DATA KEUANGAN TOTAL ---
    const [bayarP, bayarDU] = await Promise.all([
      prisma.tb_pembayaran_pendaftaran.aggregate({ _sum: { nominal: true } }),
      prisma.tb_pembayaran_daftar_ulang.aggregate({ _sum: { nominal: true } }),
    ]);

    // --- 5. TRANSAKSI TERBARU (GABUNGAN) ---
    const [trxP, trxDU] = await Promise.all([
      prisma.tb_pembayaran_pendaftaran.findMany({
        take: 5,
        orderBy: { tanggal_bayar: 'desc' },
        include: { tb_pendaftaran: { select: { nama_lengkap: true } } }
      }),
      prisma.tb_pembayaran_daftar_ulang.findMany({
        take: 5,
        orderBy: { tanggal_bayar: 'desc' },
        include: { tb_daftar_ulang: { include: { tb_pendaftaran: { select: { nama_lengkap: true } } } } }
      })
    ]);

    const gabunganTransaksi = [
      ...trxP.map(t => ({
        tanggal: t.tanggal_bayar ? new Date(t.tanggal_bayar) : new Date(),
        nominal: t.nominal || 0,
        metode: t.metode_pembayaran,
        nama: t.tb_pendaftaran.nama_lengkap,
        tipe: "Pendaftaran"
      })),
      ...trxDU.map(t => ({
        tanggal: t.tanggal_bayar ? new Date(t.tanggal_bayar) : new Date(),
        nominal: t.nominal || 0,
        metode: t.metode_pembayaran, // Pastikan ini sesuai schema.prisma (metode_bayar/metode_pembayaran)
        nama: t.tb_daftar_ulang.tb_pendaftaran.nama_lengkap,
        tipe: "Daftar Ulang"
      }))
    ]
    .sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime())
    .slice(0, 5);

    return NextResponse.json({
      cards: { totalP, totalDU, totalResmi, hariIni },
      keuangan: {
        total: (bayarP._sum.nominal || 0) + (bayarDU._sum.nominal || 0),
        pendaftaran: bayarP._sum.nominal || 0,
        daftarUlang: bayarDU._sum.nominal || 0,
      },
      weeklyChart,
      gender: genderData.map(g => ({ name: g.jenis_kelamin, value: g._count })),
      tables: {
        pendaftarBaru: await prisma.tb_pendaftaran.findMany({ take: 5, orderBy: { created_at: 'desc' } }),
        calonSiswaBaru: await prisma.tb_daftar_ulang.findMany({ 
          take: 5, 
          orderBy: { created_at: 'desc' },
          include: { tb_pendaftaran: { select: { nama_lengkap: true, jenis_kelamin: true } } } 
        }),
        transaksiTerbaru: gabunganTransaksi
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}