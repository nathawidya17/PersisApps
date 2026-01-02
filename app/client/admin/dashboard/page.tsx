"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from "recharts";
import { 
  ClipboardList, UserPlus, GraduationCap, 
  Clock, Wallet, CheckCircle 
} from 'lucide-react';

/**
 * DASHBOARD PAGE COMPONENT
 * Final Optimized Version: Line Chart Clean & Bar Chart Bold Square.
 */
export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get("/server/api/admin/dashboard");
        setData(res.data);
      } catch (err) {
        console.error("Dashboard API Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const totalGender = useMemo(() => {
    return (data?.gender || []).reduce((acc: number, curr: any) => acc + curr.value, 0);
  }, [data?.gender]);

  if (loading) {
    return (
      <div className="ml-64 p-10 flex items-center justify-center min-h-screen text-gray-400 font-light">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="ml-64 bg-[#F5F5F5] min-h-screen pb-12 px-8 pt-8 font-sans antialiased">
      <h2 className="text-2xl font-semibold text-[#2D2D2D] mb-8">Dashboard</h2>
      
      {/* 1. Overview Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <StatCard 
          label="Total Pendaftar" 
          value={data?.cards?.totalP} 
          icon={<ClipboardList size={20}/>} 
          bgColor="bg-[#E8F5E9]" 
          textColor="text-[#4CAF50]" 
        />
        <StatCard 
          label="Siswa Daftar Ulang" 
          value={data?.cards?.totalDU} 
          icon={<UserPlus size={20}/>} 
          bgColor="bg-[#FFF9C4]" 
          textColor="text-[#FBC02D]" 
        />
        <StatCard 
          label="Siswa Resmi" 
          value={data?.cards?.totalResmi} 
          icon={<GraduationCap size={20}/>} 
          bgColor="bg-[#FFEBEE]" 
          textColor="text-[#E57373]" 
        />
        <StatCard 
          label="Pendaftar Hari ini" 
          value={data?.cards?.hariIni} 
          icon={<Clock size={20}/>} 
          bgColor="bg-[#E8EAF6]" 
          textColor="text-[#7E57C2]" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* 2. Line Chart: Clean Style (No Dots) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <p className="font-bold text-lg text-[#068A50]">Penerimaan Peserta Didik Baru</p>
            <ChartLegend items={[
              { label: 'Pendaftar', color: '#4CAF50' }, 
              { label: 'Calon Siswa', color: '#FBC02D' }
            ]} />
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.weeklyChart || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E0E0E0" strokeDasharray="3 3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9E9E9E' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9E9E9E' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                {/* dot={false} untuk menghilangkan bulet-buletan */}
                <Line type="monotone" dataKey="pendaftar" stroke="#4CAF50" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="calonSiswa" stroke="#FBC02D" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Pie Chart Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="font-bold text-base text-[#068A50] mb-4 text-center">Jenis Kelamin Siswa</p>
          <div className="h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data?.gender || []} 
                  innerRadius={70} 
                  outerRadius={90} 
                  dataKey="value" 
                  startAngle={90} 
                  endAngle={450}
                  paddingAngle={5}
                >
                  {(data?.gender || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.name === "Putra" ? "#4CAF50" : "#FBC02D"} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-[#2D2D2D]">{totalGender}</span>
              <span className="text-xs text-[#9E9E9E]">Total Siswa</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {data?.gender?.map((g: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[#757575]">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.name === "Putra" ? "#4CAF50" : "#FBC02D" }} />
                {g.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Financial Section: Bold Bar Style */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <h3 className="text-[#2D2D2D] font-medium text-base mb-6">Laporan Keuangan PPDB</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <StatCard 
            label="Total Uang Masuk" 
            value={data?.keuangan?.total} 
            icon={<Wallet size={18}/>} 
            bgColor="bg-[#E3F2FD]" 
            textColor="text-[#42A5F5]"
            isFinance={true}
          />
          <StatCard 
            label="Uang Pendaftaran" 
            value={data?.keuangan?.pendaftaran} 
            icon={<CheckCircle size={18}/>} 
            bgColor="bg-[#E8F5E9]" 
            textColor="text-[#66BB6A]"
            isFinance={true}
          />
          <StatCard 
            label="Siswa Daftar Ulang" 
            value={data?.keuangan?.daftarUlang} 
            icon={<GraduationCap size={18}/>} 
            bgColor="bg-[#FFF9C4]" 
            textColor="text-[#FBC02D]"
            isFinance={true}
          />
        </div>
        
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.weeklyChart || []} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#F0F0F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9E9E9E'}} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#9E9E9E'}}
                width={50}
                tickFormatter={(val) => val >= 1000000 ? `${val/1000000}M` : val >= 1000 ? `${val/1000}K` : val}
              />
              <Tooltip cursor={{fill: '#F9F9F9'}} formatter={(val: number | undefined) => val !== undefined ? val.toLocaleString('id-ID') : '0'} />
              {/* barSize diperbesar (gendutan) dan radius 0 (kotak) */}
              <Bar dataKey="uangPendaftaran" fill="#4CAF50" radius={0} barSize={40} />
              <Bar dataKey="uangDaftarUlang" fill="#FBC02D" radius={0} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <TableComponent title="Pendaftar Baru" items={data?.tables?.pendaftarBaru || []} type="pendaftar" />
        <TableComponent title="Calon Siswa Baru" items={data?.tables?.calonSiswaBaru || []} type="calon" />
        <TableComponent title="Transaksi Terbaru" items={data?.tables?.transaksiTerbaru || []} type="transaksi" />
      </div>
    </div>
  );
}

// --- REUSABLE COMPONENTS ---

function StatCard({ label, value, icon, bgColor, textColor, isFinance = false }: any) {
  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md ${isFinance ? 'border border-[#F0F0F0]' : ''}`}>
      <div className={`w-12 h-12 ${bgColor} ${textColor} rounded-full flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="overflow-hidden">
        <p className="text-xl font-bold text-[#2D2D2D] truncate">
          {isFinance ? 'IDR ' : ''}{(value || 0).toLocaleString('id-ID')}
        </p>
        <p className="text-xs text-[#9E9E9E] font-medium truncate">{label}</p>
      </div>
    </div>
  );
}

function TableComponent({ title, items, type }: any) {
  const isTransaksi = type === "transaksi";
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm h-full flex flex-col">
      <h4 className="font-semibold text-[#2D2D2D] mb-6 text-base">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#F0F0F0]">
              <th className="text-left pb-3 font-medium text-xs text-[#9E9E9E] uppercase tracking-wider">
                {isTransaksi ? "Nominal" : "No Pendaftaran"}
              </th>
              <th className="text-center pb-3 font-medium text-xs text-[#9E9E9E] uppercase tracking-wider">
                {isTransaksi ? "Metode" : "Nama Siswa"}
              </th>
              <th className="text-right pb-3 font-medium text-xs text-[#9E9E9E] uppercase tracking-wider">
                {isTransaksi ? "Penerima" : "L/P"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FAFAFA]">
            {items.map((item: any, i: number) => {
              const dataSiswa = type === "calon" ? item.tb_pendaftaran : item;
              const displayId = type === "calon" ? item.id_daftar_ulang : item.id_pendaftar;
              return (
                <tr key={i} className="hover:bg-[#FAFAFA] transition-colors group">
                  <td className="py-4 text-[#2D2D2D] text-xs font-medium">
                    {isTransaksi ? item.nominal?.toLocaleString('id-ID') : (displayId || "-")}
                  </td>
                  <td className="py-4 text-center text-[#2D2D2D] text-xs font-normal">
                    {isTransaksi ? (
                        <span className="px-2 py-0.5  rounded text-[10px] font-bold uppercase">
                            {item.metode}
                        </span>
                    ) : dataSiswa?.nama_lengkap}
                  </td>
                  <td className="py-4 text-right text-[#2D2D2D] text-xs font-medium">
                    {isTransaksi ? item.nama : (dataSiswa?.jenis_kelamin?.charAt(0).toUpperCase() || "-")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartLegend({ items }: { items: { label: string, color: string }[] }) {
  return (
    <div className="flex gap-4 text-xs font-medium">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-[#757575]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

const tooltipStyle = {
  borderRadius: '8px',
  border: 'none',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  fontSize: '12px'
};