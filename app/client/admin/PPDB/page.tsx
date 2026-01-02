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
import Link from "next/link";
import * as XLSX from "xlsx";

export default function PPDBPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.NISN?.includes(searchTerm)
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data PPDB");
    XLSX.writeFile(wb, "Data_PPDB.xlsx");
  };

  if (loading) return <div className="ml-64 p-10 font-light text-gray-400">Memuat Data PPDB...</div>;

  return (
    <div className="ml-64 bg-gray-50 min-h-screen pb-12 px-8 pt-8 antialiased font-sans">
      <h2 className="text-xl font-bold text-gray-800 mb-6">PPDB</h2>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        {/* TOOLBAR: Menyamakan dengan DaftarSiswa */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari" 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm text-gray-400 hover:bg-gray-100 transition-all">
              <Filter size={16} />
              <span className="text-gray-600 font-medium">Filter</span>
            </button>
          </div>
          
          <button 
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-[8px] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Download size={18} />
            Export Data
          </button>
        </div>

        {/* TABEL: Samakan padding, font size, dan tracking */}
        <table className="w-full border-collapse mt-6">
          <thead>
            <tr className="text-[#94A3B8] border-b border-gray-50 text-[10px]">
              <th className="text-left py-5 px-6 font-normal uppercase tracking-widest">NISN</th>
              <th className="text-left py-5 px-6 font-normal uppercase tracking-widest">Nama Siswa</th>
              <th className="text-center py-5 px-6 font-normal uppercase tracking-widest">Jenis Kelamin</th>
              <th className="text-left py-5 px-6 font-normal uppercase tracking-widest">Tempat, Tanggal Lahir</th>
              <th className="text-center py-5 px-6 font-normal uppercase tracking-widest">Tahap</th>
              <th className="text-center py-5 px-6 font-normal uppercase tracking-widest">Jalur</th>
              <th className="text-center py-5 px-6 font-normal uppercase tracking-widest">Update Terbaru</th>
              <th className="text-center py-5 px-6 font-normal uppercase tracking-widest">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-[#3b3b3b]">
  {paginatedData.length > 0 ? (
    paginatedData.map((siswa, i) => (
      <tr key={i} className="hover:bg-gray-50/20 transition-colors duration-200">
        <td className="py-5 px-6 text-[12px] font-normal">{siswa.NISN}</td>
        <td className="py-5 px-6 text-[13px] font-normal capitalize">{siswa.nama_lengkap}</td>
        <td className="py-5 px-6 text-center">
          <span className={`px-4 py-1 rounded-full text-[11px] font-medium ${
            siswa.jenis_kelamin === 'Putra' ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'
          }`}>
            {siswa.jenis_kelamin}
          </span>
        </td>
        <td className="py-5 px-6 text-[12px] font-normal">{siswa.tempat_lahir}, {siswa.tanggal_lahir}</td>
        <td className="py-5 px-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${siswa.status === 'Daftar Ulang' ? 'bg-green-500' : 'bg-yellow-400'}`} />
            <span className="text-[12px] font-medium text-gray-700">{siswa.status}</span>
          </div>
        </td>
        <td className="py-5 px-6 text-center text-[12px] font-normal capitalize">{siswa.jalur}</td>
        <td className="py-5 px-6 text-center text-[11px] text-gray-400 font-normal">{siswa.updated_at}</td>
        <td className="py-5 px-6 text-center">
          <Link href={`/client/admin/PPDB/${siswa.id_siswa || siswa.id || siswa.NISN}`}>
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
                  <p className="text-gray-500 text-sm font-semibold">Data Siswa tidak ditemukan</p>
                </div>
            </div>
        </td>
    </tr>
  )}
</tbody>
        </table>

        {/* PAGINATION UI: Samakan persis dengan DaftarSiswa */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 mt-4">
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
            
            <div className="text-[12px] text-gray-400 flex items-center gap-2">
               <div className="relative flex items-center">
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => {setItemsPerPage(Number(e.target.value)); setCurrentPage(1);}}
                    className="appearance-none bg-transparent font-bold text-gray-600 pr-5 cursor-pointer focus:outline-none"
                  >
                    {[5, 10, 20, 50].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                  <ChevronRight size={14} className="rotate-90 absolute right-0 pointer-events-none text-gray-400"/>
               </div>
               <span className="ml-1">Items per page</span>
            </div>
          </div>
        </div>
      </div>
      <footer className="mt-8 text-[11px] text-gray-400">© Persis 212 Kudang</footer>
    </div>
  );
}