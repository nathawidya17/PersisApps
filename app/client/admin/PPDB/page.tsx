"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, Filter, Download, Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 
} from "lucide-react";
import axios from "axios";
import { displayGender, isMale } from "@/lib/gender";
import Link from "next/link";
import * as XLSX from "xlsx";

export default function PPDBPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("Semua");
  const [filterTahap, setFilterTahap] = useState("Semua");
  const [filterJalur, setFilterJalur] = useState("Semua");
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
    return data.filter(item => {
      const matchSearch = item.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) || item.NISN?.includes(searchTerm);
      const matchGender = filterGender === "Semua" || displayGender(item.jenis_kelamin) === filterGender;
      
      // --- PERBAIKAN FILTER TAHAP DI SINI ---
      // Menggunakan .includes() agar "Daftar Ulang (Belum Bayar)" tetap masuk saat difilter "Daftar Ulang"
      const matchTahap = filterTahap === "Semua" || item.status?.toLowerCase().includes(filterTahap.toLowerCase());
      
      const matchJalur = filterJalur === "Semua" || item.jalur?.toLowerCase() === filterJalur.toLowerCase();
      
      return matchSearch && matchGender && matchTahap && matchJalur;
    });
  }, [data, searchTerm, filterGender, filterTahap, filterJalur]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  useEffect(() => { setCurrentPage(1); }, [itemsPerPage, filterGender, filterTahap, filterJalur, searchTerm]);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportFull = async () => {
    try {
        setIsExporting(true);
        const response = await axios.get("/server/api/admin/PPDB/export");
        const { siswa, ortu, prestasi, pembayaran } = response.data;

        const ws_data: any[][] = [];

        // === 1. DATA SISWA ===
        ws_data.push(["DATA SISWA"]); 
        // Header lengkap
        ws_data.push([
            "NISN", "NAMA LENGKAP", "NIK", "NO KK", "JK", "TTL", 
            "ALAMAT RUMAH", "KODE POS", "UKURAN BAJU", "ASAL SEKOLAH", "KODE POS SEKOLAH", "NO HP", "JALUR"
        ]); 
        
        siswa.forEach((s: any) => {
            ws_data.push([
                s["NISN"], s["Nama Lengkap"], s["NIK"], s["No KK"], s["JK"], s["TTL"], 
                s["Alamat"], s["Kode Pos"], s["Ukuran Baju"], s["Asal Sekolah"], s["Kode Pos Sekolah"], s["No HP"], s["Jalur"]
            ]);
        });
        
        ws_data.push([]); 
        ws_data.push([]); 

        // === 2. DATA ORANG TUA ===
        ws_data.push(["DATA ORANG TUA SISWA"]); 
        // Header lengkap dengan TTL & Penghasilan
        ws_data.push([
            "SISWA TERKAIT", 
            "NAMA AYAH", "TTL AYAH", "PEKERJAAN AYAH", "PENGHASILAN AYAH", "NO HP ORTU", 
            "NAMA IBU", "TTL IBU", "PEKERJAAN IBU", "PENGHASILAN IBU"
        ]); 
        
        ortu.forEach((o: any) => {
            ws_data.push([
                o["Siswa Terkait"], 
                o["Nama Ayah"], o["TTL Ayah"], o["Pekerjaan Ayah"], o["Penghasilan Ayah"], o["No HP Ayah"], 
                o["Nama Ibu"], o["TTL Ibu"], o["Pekerjaan Ibu"], o["Penghasilan Ibu"]
            ]);
        });

        ws_data.push([]); 
        ws_data.push([]); 

        // === 3. DATA PRESTASI ===
        ws_data.push(["DATA PRESTASI SISWA"]); 
        if(prestasi.length > 0) {
            ws_data.push(["SISWA TERKAIT", "NAMA PRESTASI", "TINGKAT", "PERINGKAT", "TAHUN", "PENYELENGGARA"]); 
            prestasi.forEach((p: any) => {
                ws_data.push([p["Siswa Terkait"], p["Nama Prestasi"], p["Tingkat"], p["Peringkat"], p["Tahun"], p["Penyelenggara"]]);
            });
        } else {
             ws_data.push(["Tidak ada data prestasi"]);
        }

        ws_data.push([]); 
        ws_data.push([]); 

        // === 4. DATA PEMBAYARAN ===
        ws_data.push(["DATA PEMBAYARAN (RINCIAN)"]); 
        if(pembayaran.length > 0) {
            ws_data.push(["SISWA TERKAIT", "ITEM PEMBAYARAN", "NOMINAL (IDR)", "METODE", "STATUS", "TANGGAL BAYAR"]); 
            pembayaran.forEach((p: any) => {
                ws_data.push([
                    p["Siswa Terkait"], p["Nama Tagihan"], p["Nominal"], 
                    p["Metode"]?.toUpperCase(), p["Status"]?.toUpperCase(), p["Tanggal Bayar"]
                ]);
            });
        } else {
            ws_data.push(["Belum ada data pembayaran"]);
        }

        const worksheet = XLSX.utils.aoa_to_sheet(ws_data);
        const workbook = XLSX.utils.book_new();

        // Atur Lebar Kolom (Manual, dilebihkan biar muat)
        worksheet['!cols'] = [
            { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 25 }, 
            { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Lengkap");
        const timestamp = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `Laporan_PPDB_Lengkap_${timestamp}.xlsx`);

    } catch (error) {
        console.error("Export Error:", error);
        alert("Gagal export data.");
    } finally {
        setIsExporting(false);
    }
  };

  if (loading) return <div className="ml-64 p-10 font-light text-gray-400">Memuat Data PPDB...</div>;

  return (
    <div className="ml-64 bg-gray-100 min-h-screen pb-10 px-5 pt-5 antialiased font-sans">
      <h2 className="text-xl font-bold text-gray-800 mb-5">PPDB (Proses Seleksi)</h2>

      <div className="bg-white p-6 rounded-[12px] shadow-sm border border-gray-100 mb-5 overflow-hidden">
        
        {/* TOOLBAR */}
        <div className="flex flex-col xl:flex-row justify-between gap-5">
          <div className="flex flex-1 gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Cari..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
            </div>
            
            <div className="relative">
              <select className="appearance-none pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm cursor-pointer w-full text-gray-600 focus:outline-none" value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
                <option value="Semua">Semua Gender</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
             <div className="relative">
              <select className="appearance-none pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm cursor-pointer w-full text-gray-600 focus:outline-none" value={filterTahap} onChange={(e) => setFilterTahap(e.target.value)}>
                <option value="Semua">Semua Tahap</option>
                <option value="Pendaftaran">Pendaftaran</option>
                <option value="Daftar Ulang">Daftar Ulang</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
             <div className="relative">
              <select className="appearance-none pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm cursor-pointer w-full text-gray-600 focus:outline-none" value={filterJalur} onChange={(e) => setFilterJalur(e.target.value)}>
                <option value="Semua">Semua Jalur</option>
                <option value="Umum">Umum</option>
                <option value="Prestasi">Prestasi</option>
                <option value="Tahfidz">Tahfidz</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          
          <button 
            onClick={handleExportFull}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-white-600 text-gray-600 rounded-[8px] border border-gray-200 text-sm font-bold  shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} />}
            {isExporting ? "Menyusun Data..." : "Export Data"}
          </button>
        </div>

        {/* TABEL UI */}
        <div className="overflow-x-auto mt-6">
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
                    <td className="py-5 px-6 text-[12px] font-normal whitespace-nowrap">{siswa.NISN}</td>
                    <td className="py-5 px-6 text-[13px] font-normal capitalize whitespace-nowrap max-w-[200px] truncate" title={siswa.nama_lengkap}>{siswa.nama_lengkap}</td>
                    <td className="py-5 px-6 text-center whitespace-nowrap">
                      <span className={`px-4 py-1 rounded-full text-[11px] font-medium inline-block ${isMale(siswa.jenis_kelamin) ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'}`}>{displayGender(siswa.jenis_kelamin)}</span>
                    </td>
                    <td className="py-5 px-6 text-[12px] font-normal whitespace-nowrap">{siswa.tempat_lahir}, {siswa.tanggal_lahir}</td>
                    <td className="py-5 px-6 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${siswa.status && siswa.status.toLowerCase().includes('daftar ulang') ? 'bg-green-500' : 'bg-yellow-400'}`} />
                        <span className="text-[12px] font-medium text-gray-700 capitalize">{siswa.status}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-center text-[12px] font-normal capitalize whitespace-nowrap">{siswa.jalur}</td>
                    <td className="py-5 px-6 text-center text-[11px] text-gray-400 font-normal whitespace-nowrap">{siswa.updated_at}</td>
                    <td className="py-5 px-6 text-center whitespace-nowrap">
                      <Link href={`/client/admin/PPDB/${siswa.id_siswa || siswa.id || siswa.NISN}`}>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"><Info size={18} /></button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="py-20 text-center"><p className="text-gray-500 text-sm font-semibold">Data Siswa tidak ditemukan</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination UI */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 mt-2">
            <p className="text-[12px] text-gray-400 font-medium">Page {currentPage} of {totalPages}</p>
             <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30"><ChevronLeft size={18}/></button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30"><ChevronRight size={18}/></button>
             </div>
        </div>

      </div>
      <footer className="mt-8 text-[11px] text-gray-400 uppercase tracking-widest">© MA PERSIS KUDANG</footer>
    </div>
  );
}