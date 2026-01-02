"use client";

import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { 
  Search, Filter, Download, Info, 
  Users, Mars, Venus, CreditCard,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight 
} from "lucide-react";
import * as XLSX from "xlsx";
import Link from "next/link";

export default function DaftarSiswaPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGender, setFilterGender] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    axios.get("/server/api/admin/DaftarSiswa")
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching data", err));
  }, []);

  const stats = useMemo(() => {
    return {
      total: data.length,
      putra: data.filter(s => s.jenis_kelamin?.toLowerCase() === "putra").length,
      putri: data.filter(s => s.jenis_kelamin?.toLowerCase() === "putri").length,
      belumLunas: data.filter(s => s.status_pembayaran === "belum_lunas").length,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(s => {
      const matchSearch = 
        s.NISN?.toLowerCase().includes(searchQuery.toLowerCase()) || // Pastikan NISN kapital sesuai DB
        s.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchFilter = filterGender === "Semua" || s.jenis_kelamin === filterGender;
      
      return matchSearch && matchFilter;
    });
  }, [data, searchQuery, filterGender]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(s => ({
      NISN: s.NISN,
      "Nama Siswa": s.nama_lengkap,
      "Jenis Kelamin": s.jenis_kelamin,
      "Tempat Lahir": s.tempat_lahir,
      "Tanggal Lahir": s.tanggal_lahir ? s.tanggal_lahir.split('T')[0] : "-",
      "Tipe Siswa": s.tipe_siswa,
      "Jalur Pendaftaran": s.jalur_pendaftaran,
      "Update Terbaru": s.updated_at ? s.updated_at.split('T')[0] : "-"
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Siswa");
    XLSX.writeFile(wb, "Daftar_Siswa_PPDB.xlsx");
  };

  if (loading) return <div className="ml-64 p-10 font-light text-gray-400">Memuat Data Siswa...</div>;

  return (
    <div className="ml-64 bg-gray-50 min-h-screen pb-12 px-8 pt-8 antialiased font-sans">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Daftar Siswa</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Siswa" value={stats.total} icon={<Users size={22} strokeWidth={1.5} />} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatCard label="Siswa Putra" value={stats.putra} icon={<Mars size={22} strokeWidth={1.5} />} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
        <StatCard label="Siswa Putri" value={stats.putri} icon={<Venus size={22} strokeWidth={1.5} />} iconBg="bg-red-50" iconColor="text-red-600" />
        <StatCard label="Siswa Belum Lunas" value={stats.belumLunas} icon={<CreditCard size={22} strokeWidth={1.5} />} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <select 
                className="appearance-none pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <option value="Semua">Semua Gender</option>
                <option value="Putra">Putra</option>
                <option value="Putri">Putri</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          
          <button 
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-[8px] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Download size={18} />
            Export Data
          </button>
        </div>

        <table className="w-full border-collapse mt-6">
<thead>
  <tr className="text-[#94A3B8] border-b border-gray-50 text-[10px]">
    <th className="text-left py-5 px-6 font-normal uppercase tracking-widest whitespace-nowrap">NISN</th>
    <th className="text-left py-5 px-6 font-normal uppercase tracking-widest whitespace-nowrap">Nama Siswa</th>
    <th className="text-center py-5 px-6 font-normal uppercase tracking-widest whitespace-nowrap">Jenis Kelamin</th>
    <th className="text-left py-5 px-6 font-normal uppercase tracking-widest whitespace-nowrap">Tempat, Tanggal Lahir</th>
    <th className="text-center py-5 px-6 font-normal uppercase tracking-widest whitespace-nowrap">Tipe Siswa</th>
    <th className="text-center py-5 px-6 font-normal uppercase tracking-widest whitespace-nowrap">Jalur</th>
    <th className="text-center py-5 px-6 font-normal uppercase tracking-widest whitespace-nowrap">Update Terbaru</th>
    <th className="text-center py-5 px-6 font-normal uppercase tracking-widest whitespace-nowrap">Detail</th>
  </tr>
</thead>
         <tbody className="divide-y divide-gray-50 text-[#3b3b3b]">
  {paginatedData.length > 0 ? (
    paginatedData.map((item, i) => (
      <tr key={i} className="hover:bg-gray-50/20 transition-colors duration-200">
        <td className="py-5 px-6 text-[12px] font-normal">{item.NISN}</td>
        <td className="py-5 px-6 text-[13px] font-normal">{item.nama_lengkap}</td>
        <td className="py-5 px-6 text-center">
          <span className={`px-4 py-1 rounded-full text-[11px] font-medium ${
            item.jenis_kelamin === 'Putra' ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'
          }`}>
            {item.jenis_kelamin}
          </span>
        </td>
        <td className="py-5 px-6 text-[12px] font-normal">
          {item.tempat_lahir}, {item.tanggal_lahir?.split('T')[0]}
        </td>
        <td className="py-5 px-6 text-center">
          <span className={`px-4 py-1 rounded-full text-[11px] font-medium capitalize ${
            item.tipe_siswa === 'Reguler' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
          }`}>
            {item.tipe_siswa}
          </span>
        </td>
        <td className="py-5 px-6 text-center text-[12px] font-normal capitalize">{item.jalur_pendaftaran}</td>
        <td className="py-5 px-6 text-center text-[11px] text-gray-400 font-normal">
          {item.updated_at?.split('T')[0]}
        </td>
        <td className="py-5 px-6 text-center">
          <Link href={`/client/admin/DaftarSiswa/${item.id_siswa || item.id || item.NISN}`}>
            <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
              <Info size={18} />
            </button>
          </Link>
        </td>
      </tr>
    ))
  ) : (
    /* PESAN JIKA DATA TIDAK DITEMUKAN */
    <tr>
      <td colSpan={8} className="py-20 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="bg-gray-50 p-4 rounded-full">
            <Search size={40} className="text-gray-200" />
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 text-sm font-semibold">Data siswa tidak ditemukan</p>
          </div>
        </div>
      </td>
    </tr>
  )}
</tbody>
        </table>

        {/* Pagination UI */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50">
          <p className="text-[12px] text-gray-400 font-medium">
            {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} items
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30"><ChevronsLeft size={18}/></button>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30"><ChevronLeft size={18}/></button>
              <div className="flex items-center gap-2 px-2">
                {[...Array(totalPages)].map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      currentPage === idx + 1 ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30"><ChevronRight size={18}/></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30"><ChevronsRight size={18}/></button>
            </div>
            
            {/* 2. Bagian Items Per Page yang diperbaiki */}
            <div className="text-[12px] text-gray-400 flex items-center gap-2">
               <div className="relative">
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="appearance-none bg-transparent font-bold text-gray-600 pr-4 cursor-pointer focus:outline-none"
                  >
                    {[5, 10, 20, 50].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                  <ChevronRight size={14} className="rotate-90 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"/>
               </div>
               <span className="ml-2">Items per page</span>
            </div>
          </div>
        </div>
      </div>
      <footer className="mt-8 text-[11px] text-gray-400">© Persis 212 Kudang</footer>
    </div>
  );
}

function StatCard({ label, value, icon, iconBg, iconColor }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-all hover:shadow-md">
      <div className={`w-12 h-12 ${iconBg} ${iconColor} rounded-full flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-none">
          {(value || 0).toLocaleString('id-ID')}
        </p>
        <p className="text-[11px] text-gray-400 mt-1 font-medium uppercase tracking-widest">
          {label}
        </p>
      </div>
    </div>
  );
}