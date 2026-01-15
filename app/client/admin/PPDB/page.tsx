"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";
import axios from "axios";
import { displayGender, isMale } from "@/lib/gender";
import Link from "next/link";
import * as XLSX from "xlsx";

export default function PPDBPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE FILTERING ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("Semua");
  const [filterTahap, setFilterTahap] = useState("Semua");
  const [filterJalur, setFilterJalur] = useState("Semua");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/server/api/admin/PPDB");
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Gagal mengambil data PPDB:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- LOGIC FILTERING (UPDATED) ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 1. Search (Nama / NISN)
      const matchSearch = 
        item.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.NISN?.includes(searchTerm);

      // 2. Filter Gender (Laki-laki / Perempuan) — compare normalized display value
      const matchGender = filterGender === "Semua" || displayGender(item.jenis_kelamin) === filterGender;

      // 3. Filter Tahap (Pendaftaran / Daftar Ulang)
      const matchTahap = filterTahap === "Semua" || item.status?.toLowerCase() === filterTahap.toLowerCase();

      // 4. Filter Jalur (Umum / Tahfidz / Prestasi)
      const matchJalur = filterJalur === "Semua" || item.jalur?.toLowerCase() === filterJalur.toLowerCase();

      return matchSearch && matchGender && matchTahap && matchJalur;
    });
  }, [data, searchTerm, filterGender, filterTahap, filterJalur]);

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  // Reset ke page 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, filterGender, filterTahap, filterJalur, searchTerm]);

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- EXPORT EXCEL ---
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(s => ({
      NISN: s.NISN,
      Nama: s.nama_lengkap,
      Gender: displayGender(s.jenis_kelamin),
      TTL: `${s.tempat_lahir}, ${s.tanggal_lahir}`,
      Tahap: s.status,
      Jalur: s.jalur,
      Update: s.updated_at
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data PPDB");
    XLSX.writeFile(wb, "Data_PPDB.xlsx");
  };

  if (loading) return <div className="ml-64 p-10 font-light text-gray-400">Memuat Data PPDB...</div>;

  return (
    <div className="ml-64 bg-gray-100 min-h-screen pb-10 px-5 pt-5 antialiased font-sans">
      <h2 className="text-xl font-bold text-gray-800 mb-5">PPDB</h2>

      <div className="bg-white p-6 rounded-[12px] shadow-sm border border-gray-100 mb-5 overflow-hidden">
        
        {/* TOOLBAR FILTER */}
        <div className="flex flex-col xl:flex-row justify-between gap-5">
          <div className="flex flex-1 gap-3 flex-wrap">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Gender */}
            <div className="relative">
              <select 
                className="appearance-none pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none cursor-pointer w-full text-gray-600"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <option value="Semua">Semua Gender</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>

            {/* Filter Tahap */}
            <div className="relative">
              <select 
                className="appearance-none pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none cursor-pointer w-full text-gray-600"
                value={filterTahap}
                onChange={(e) => setFilterTahap(e.target.value)}
              >
                <option value="Semua">Semua Tahap</option>
                <option value="Pendaftaran">Pendaftaran</option>
                <option value="Daftar Ulang">Daftar Ulang</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>

            {/* Filter Jalur */}
            <div className="relative">
              <select 
                className="appearance-none pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none cursor-pointer w-full text-gray-600"
                value={filterJalur}
                onChange={(e) => setFilterJalur(e.target.value)}
              >
                <option value="Semua">Semua Jalur</option>
                <option value="Umum">Umum</option>
                <option value="Prestasi">Prestasi</option>
                <option value="Tahfidz">Tahfidz</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>

          </div>
          
          <button 
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-[8px] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shrink-0"
          >
            <Download size={18} />
            Export Data
          </button>
        </div>

        {/* TABEL */}
        <div className="overflow-x-auto mt-6">
          {/* min-w dipasang agar kolom tidak menyempit ekstrem */}
          <table className="w-full border-collapse min-w-[1000px]"> 
            <thead>
              <tr className="text-[#94A3B8] border-b border-gray-50 text-[10px]">
                <th className="text-left py-5 px-6 font-normal tracking-widest whitespace-nowrap">NISN</th>
                <th className="text-left py-5 px-6 font-normal tracking-widest whitespace-nowrap">Nama Siswa</th>
                <th className="text-center py-5 px-6 font-normal tracking-widest whitespace-nowrap">Jenis Kelamin</th>
                <th className="text-left py-5 px-6 font-normal tracking-widest whitespace-nowrap">Tempat, Tanggal Lahir</th>
                <th className="text-center py-5 px-6 font-normal tracking-widest whitespace-nowrap">Tahap</th>
                <th className="text-center py-5 px-6 font-normal tracking-widest whitespace-nowrap">Jalur</th>
                <th className="text-center py-5 px-6 font-normal tracking-widest whitespace-nowrap">Update Terbaru</th>
                <th className="text-center py-5 px-6 font-normal tracking-widest whitespace-nowrap">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[#3b3b3b]">
              {paginatedData.length > 0 ? (
                paginatedData.map((siswa, i) => (
                  <tr key={i} className="hover:bg-gray-50/20 transition-colors duration-200">
                    
                    {/* NISN */}
                    <td className="py-5 px-6 text-[12px] font-normal whitespace-nowrap">
                      {siswa.NISN}
                    </td>
                    
                    {/* NAMA: max-width + truncate agar tidak turun baris jika kepanjangan */}
                    <td className="py-5 px-6 text-[13px] font-normal capitalize whitespace-nowrap max-w-[200px] truncate" title={siswa.nama_lengkap}>
                      {siswa.nama_lengkap}
                    </td>

                    {/* GENDER */}
                    <td className="py-5 px-6 text-center whitespace-nowrap">
                      <span className={`px-4 py-1 rounded-full text-[11px] font-medium inline-block ${
                        isMale(siswa.jenis_kelamin) ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'
                      }`}>
                        {displayGender(siswa.jenis_kelamin)}
                      </span>
                    </td>

                    {/* TTL */}
                    <td className="py-5 px-6 text-[12px] font-normal whitespace-nowrap">
                      {siswa.tempat_lahir}, {siswa.tanggal_lahir}
                    </td>

                    {/* TAHAP */}
                    <td className="py-5 px-6 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          siswa.status === 'Daftar Ulang' ? 'bg-green-500' : 'bg-yellow-400'
                        }`} />
                        <span className="text-[12px] font-medium text-gray-700 capitalize">
                          {siswa.status}
                        </span>
                      </div>
                    </td>

                    {/* JALUR */}
                    <td className="py-5 px-6 text-center text-[12px] font-normal capitalize whitespace-nowrap">
                      {siswa.jalur}
                    </td>

                    {/* UPDATE */}
                    <td className="py-5 px-6 text-center text-[11px] text-gray-400 font-normal whitespace-nowrap">
                      {siswa.updated_at}
                    </td>

                    {/* DETAIL */}
                    <td className="py-5 px-6 text-center whitespace-nowrap">
                      <Link href={`/client/admin/PPDB/${siswa.id_siswa || siswa.id || siswa.NISN}`}>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer">
                          <span className="sr-only">Detail</span>
                          <Info size={18} />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Search size={40} className="text-gray-200" />
                      </div>
                      <p className="text-gray-500 text-sm font-semibold">Data Siswa tidak ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION UI */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 mt-2">
          <p className="text-[12px] text-gray-400 font-medium whitespace-nowrap">
            {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} items
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30 cursor-pointer"><ChevronsLeft size={18}/></button>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30 cursor-pointer"><ChevronLeft size={18}/></button>
              <div className="flex items-center gap-2 px-2 hidden sm:flex">
                {[...Array(totalPages)].map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === idx + 1 ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30 cursor-pointer"><ChevronRight size={18}/></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30 cursor-pointer"><ChevronsRight size={18}/></button>
            </div>
            
            <div className="text-[12px] text-gray-400 flex items-center gap-2 whitespace-nowrap">
               <div className="relative flex items-center">
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="appearance-none bg-transparent font-bold text-gray-600 pr-5 cursor-pointer focus:outline-none"
                  >
                    {[5, 10, 20, 50].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                  <ChevronRight size={14} className="rotate-90 absolute right-0 pointer-events-none text-gray-400"/>
               </div>
               <span className="ml-1 hidden sm:inline">Items per page</span>
            </div>
          </div>
        </div>
      </div>
      <footer className="mt-8 text-[11px] text-gray-400 uppercase tracking-widest">© MA PERSIS KUDANG</footer>
    </div>
  );
}