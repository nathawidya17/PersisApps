import prisma from "@/lib/prisma"; 
import Sidebar from "@/components/Sidebar"; 
import StatCard from "@/components/dashboard/StatCard";
import MainChart from "@/components/dashboard/MainChart";
import GenderChart from "@/components/dashboard/GenderChart";
import RevenueSection from "@/components/dashboard/RevenueSection";
import DataTable from "@/components/dashboard/DataTable";

export default async function DashboardPage() {
  // Ambil data secara paralel dari database db_persis
const [
    totalPendaftar,
    totalDaftarUlang,
    totalSiswaResmi,
    pendaftarHariIni,
    listPendaftar,
    listCalonSiswa,
    listTransaksi,
    genderStats
  ] = await Promise.all([
    prisma.tb_pendaftaran.count(), // PAKAI AN (tb_pendaftaran)
    prisma.tb_daftar_ulang.count(),
    prisma.tb_siswa.count(),
    prisma.tb_pendaftaran.count({ // PAKAI AN (tb_pendaftaran)
      where: { created_at: { gte: new Date(new Date().setHours(0,0,0,0)) } }
    }),
    prisma.tb_pendaftaran.findMany({ take: 5, orderBy: { created_at: 'desc' } }), // PAKAI AN
    prisma.tb_siswa.findMany({ take: 5 }), 
    prisma.tb_pembayaran.findMany({ take: 5, orderBy: { tanggal_bayar: 'desc' } }),
    prisma.tb_siswa.groupBy({ by: ['jenis_kelamin'], _count: true })
  ]);
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar sesuai warna hijau di gambar */}
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-3">
             <div className="text-right">
                <p className="text-sm font-bold">Admin PPDB</p>
                <p className="text-xs text-gray-400">Operator</p>
             </div>
             <div className="w-10 h-10 bg-[#2D5A3F] rounded-full flex items-center justify-center text-white">A</div>
          </div>
        </div>

        {/* 4 Statistik Utama */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Pendaftar" value={totalPendaftar} icon="list" color="bg-green-50" textColor="text-green-600" />
          <StatCard title="Siswa Daftar Ulang" value={totalDaftarUlang} icon="user-check" color="bg-yellow-50" textColor="text-yellow-600" />
          <StatCard title="Siswa Resmi" value={totalSiswaResmi} icon="school" color="bg-orange-50" textColor="text-orange-600" />
          <StatCard title="Pendaftar Hari Ini" value={pendaftarHariIni} icon="calendar" color="bg-purple-50" textColor="text-purple-600" />
        </div>

        {/* Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[#2D5A3F] font-bold mb-4">Penerimaan Peserta Didik Baru</h3>
            <MainChart /> 
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[#2D5A3F] font-bold mb-4 text-center">Jenis Kelamin Siswa</h3>
            <GenderChart data={genderStats} total={totalSiswaResmi} />
          </div>
        </div>

        {/* Uang Masuk PPDB (Logic: Pendaftaran + Daftar Ulang) */}
        <RevenueSection />

        {/* Bottom Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <DataTable title="Pendaftar Baru" data={listPendaftar} />
          <DataTable title="Calon Siswa Baru" data={listCalonSiswa} />
          <DataTable title="Transaksi Terbaru" data={listTransaksi} type="transaction" />
        </div>
      </main>
    </div>
  );
}