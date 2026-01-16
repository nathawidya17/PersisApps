"use client";

import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { displayGender, isMale, isFemale } from "@/lib/gender";
import { 
  Search, Filter, Download, Info, 
  Users, Mars, Venus, CreditCard,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 
} from "lucide-react";
import * as XLSX from "xlsx";
import Link from "next/link";

export default function DaftarSiswaPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE FILTERING ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGender, setFilterGender] = useState("Semua");
  const [filterTipe, setFilterTipe] = useState("Semua");        
  const [filterJalur, setFilterJalur] = useState("Semua");      
  const [filterStatus, setFilterStatus] = useState("Semua");    

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isExporting, setIsExporting] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = () => {
        axios.get("/server/api/admin/DaftarSiswa")
        .then(res => {
            setData(res.data);
            setLoading(false);
        })
        .catch(err => console.error("Error fetching data", err));
    };
    fetchData();
  }, []);

  // --- STATS DATA ---
  const stats = useMemo(() => {
    return {
      total: data.length,
      putra: data.filter(s => isMale(s.jenis_kelamin)).length,
      putri: data.filter(s => isFemale(s.jenis_kelamin)).length,
      belumLunas: data.filter(s => s.status_pembayaran === "belum_lunas").length,
    };
  }, [data]);

  // --- LOGIC FILTERING ---
  const filteredData = useMemo(() => {
    return data.filter(s => {
      const matchSearch = 
        (s.NISN?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
        (s.nama_lengkap?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
      const matchGender = filterGender === "Semua" || displayGender(s.jenis_kelamin) === filterGender;
      const matchTipe = filterTipe === "Semua" || (s.tipe_siswa?.toLowerCase() || "") === filterTipe.toLowerCase();
      const matchJalur = filterJalur === "Semua" || (s.jalur_pendaftaran?.toLowerCase() || "") === filterJalur.toLowerCase();
      
      let matchStatus = true;
      if (filterStatus !== "Semua") {
          const statusLower = s.status_pembayaran?.toLowerCase();
          matchStatus = statusLower === filterStatus.toLowerCase();
      }

      return matchSearch && matchGender && matchTipe && matchJalur && matchStatus;
    });
  }, [data, searchQuery, filterGender, filterTipe, filterJalur, filterStatus]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, filterGender, filterTipe, filterJalur, filterStatus, searchQuery]);

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- EXPORT LOGIC (FIXED: MENGGUNAKAN DATA LOKAL YG SUDAH DIPERBAIKI) ---
  const exportToExcel = () => {
    try {
        setIsExporting(true);

        // Gunakan filteredData agar hasil export sesuai dengan yang tampil (hasil filter)
        const dataToExport = filteredData.length > 0 ? filteredData : data;

        if (dataToExport.length === 0) {
            alert("Tidak ada data siswa untuk diexport");
            setIsExporting(false);
            return;
        }

        const ws_data: any[][] = [];

        // === A. TABEL DATA SISWA ===
        ws_data.push(["DATA SISWA LENGKAP"]);
        ws_data.push([
            "NISN", "NAMA LENGKAP", "NIK", "NO KK", "JK", "TTL", 
            "ALAMAT LENGKAP", "KODE POS", "HP SISWA", "EMAIL", 
            "ASAL SEKOLAH", "THN LULUS", "UKURAN BAJU", "TIPE", "JALUR", "STATUS BAYAR"
        ]);
        
        dataToExport.forEach((s: any) => {
            ws_data.push([
                s.NISN, s.nama_lengkap, s.nik || "-", s.no_kk || "-", displayGender(s.jenis_kelamin), 
                `${s.tempat_lahir || ""}, ${s.tanggal_lahir ? new Date(s.tanggal_lahir).toLocaleDateString('id-ID') : ""}`,
                s.alamat || "-", s.kode_pos || "-", s.no_hp || "-", s.email || "-",
                s.asal_sekolah || "-", s.tahun_lulus || "-", s.ukuran_baju || "-", 
                s.tipe_siswa || "Reguler", s.jalur_pendaftaran || "Umum", 
                s.status_pembayaran === 'lunas' ? "LUNAS" : "BELUM LUNAS"
            ]);
        });

        ws_data.push([]); 
        ws_data.push([]); 

        // === B. TABEL DATA ORANG TUA ===
        ws_data.push(["DATA ORANG TUA"]); 
        ws_data.push([
            "SISWA TERKAIT", 
            "NAMA AYAH", "PEKERJAAN AYAH", "PENDIDIKAN AYAH", "PENGHASILAN AYAH", "NO HP ORTU",
            "NAMA IBU", "PEKERJAAN IBU", "PENDIDIKAN IBU", "PENGHASILAN IBU"
        ]);

        dataToExport.forEach((s: any) => {
            const ortu = s.tb_orang_tua && s.tb_orang_tua[0] ? s.tb_orang_tua[0] : {};
            ws_data.push([
                s.nama_lengkap,
                ortu.nama_ayah || "-", ortu.pekerjaan_ayah || "-", ortu.pendidikan_ayah || "-", ortu.penghasilan_ayah || "-", ortu.no_hp_orang_tua || "-",
                ortu.nama_ibu || "-", ortu.pekerjaan_ibu || "-", ortu.pendidikan_ibu || "-", ortu.penghasilan_ibu || "-"
            ]);
        });

        ws_data.push([]); 
        ws_data.push([]); 

        // === C. TABEL RINCIAN TAGIHAN & PEMBAYARAN (YANG DIMINTA) ===
        ws_data.push(["RINCIAN TAGIHAN & PEMBAYARAN"]);
        ws_data.push([
            "NISN", 
            "NAMA SISWA", 
            "ITEM TAGIHAN", 
            "HARGA TAGIHAN (IDR)", 
            "TOTAL TERBAYAR (IDR)", 
            "SISA TAGIHAN (IDR)", 
            "STATUS", 
            "TANGGAL BAYAR TERAKHIR"
        ]);

        dataToExport.forEach((s: any) => {
            // Cek apakah backend sudah mengirim detail_tagihan (dari fix sebelumnya)
            if (s.detail_tagihan && Array.isArray(s.detail_tagihan)) {
                s.detail_tagihan.forEach((tagihan: any) => {
                    const sisa = Math.max(0, Number(tagihan.nominal_tagihan) - Number(tagihan.terbayar));
                    ws_data.push([
                        s.NISN,
                        s.nama_lengkap,
                        tagihan.nama_tagihan,
                        tagihan.nominal_tagihan, // Harga Asli
                        tagihan.terbayar,        // Terbayar (Per Item)
                        sisa,                    // Sisa
                        tagihan.status,
                        tagihan.tanggal_bayar
                    ]);
                });
            } else {
                ws_data.push([s.NISN, s.nama_lengkap, "Data rincian belum dimuat", 0, 0, 0, "-", "-"]);
            }
        });

        // GENERATE FILE
        const worksheet = XLSX.utils.aoa_to_sheet(ws_data);
        const workbook = XLSX.utils.book_new();

        // Atur Lebar Kolom
        worksheet['!cols'] = [
            { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, 
            { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 25 }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Lengkap");
        XLSX.writeFile(workbook, `Laporan_Siswa_Lengkap_${new Date().toISOString().slice(0,10)}.xlsx`);

    } catch (error) {
        console.error("Export Error:", error);
        alert("Gagal export data.");
    } finally {
        setIsExporting(false);
    }
  };

  if (loading) return <div className="ml-64 p-10 font-light text-gray-400 flex items-center gap-2"><Loader2 className="animate-spin"/> Memuat Data Siswa...</div>;

  return (
    <div className="ml-64 bg-gray-100 min-h-screen pb-10 px-5 pt-5 antialiased font-sans">
      <h2 className="text-xl font-bold text-gray-800 mb-5">Daftar Siswa</h2>
      
      <div className="flex flex-wrap gap-5 mb-5">
        <StatCard label="Total Siswa" value={stats.total} icon={<Users size={22} />} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatCard label="Siswa Laki-laki" value={stats.putra} icon={<Mars size={22} />} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
        <StatCard label="Siswa Perempuan" value={stats.putri} icon={<Venus size={22} />} iconBg="bg-red-50" iconColor="text-red-600" />
        <StatCard label="Siswa Belum Lunas" value={stats.belumLunas} icon={<CreditCard size={22} />} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
      </div>

      <div className="bg-white p-6 rounded-[12px] shadow-sm border border-gray-100 mb-5 overflow-hidden text-left">
        <div className="flex flex-col xl:flex-row justify-between gap-5">
          <div className="flex flex-1 gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Cari NISN atau Nama..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-1 focus:ring-green-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="relative">
              <select className="appearance-none pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none cursor-pointer w-full" value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
                <option value="Semua">Semua Gender</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
            <div className="relative">
              <select className="appearance-none pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none cursor-pointer w-full" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="Semua">Semua Status</option>
                <option value="lunas">Lunas</option>
                <option value="belum_lunas">Belum Lunas</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          
          {/* TOMBOL EXPORT YANG SUDAH DIPERBAIKI */}
          <button onClick={exportToExcel} disabled={isExporting} className={`flex items-center justify-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-[8px] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shrink-0 ${isExporting ? 'opacity-70' : ''}`}>
            {isExporting ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} />}
            {isExporting ? "Menyusun Data..." : "Export Data"}
          </button>
        </div>

        <div className="overflow-x-auto mt-6">
            <table className="w-full border-collapse">
            <thead>
                <tr className="text-[#94A3B8] border-b border-gray-50 text-[10px]">
                <th className="text-left py-4 px-6 font-normal tracking-widest whitespace-nowrap uppercase">NISN</th>
                <th className="text-left py-4 px-6 font-normal tracking-widest whitespace-nowrap uppercase">Nama Siswa</th>
                <th className="text-center py-4 px-6 font-normal tracking-widest whitespace-nowrap uppercase">Jenis Kelamin</th>
                <th className="text-left py-4 px-6 font-normal tracking-widest whitespace-nowrap uppercase">Tempat, Tanggal Lahir</th>
                <th className="text-center py-4 px-6 font-normal tracking-widest whitespace-nowrap uppercase">Tipe Siswa</th>
                <th className="text-center py-4 px-6 font-normal tracking-widest whitespace-nowrap uppercase">Jalur</th>
                <th className="text-center py-4 px-6 font-normal tracking-widest whitespace-nowrap uppercase">Status Bayar</th>
                <th className="text-center py-4 px-6 font-normal tracking-widest whitespace-nowrap uppercase">Detail</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[#3b3b3b]">
                {paginatedData.length > 0 ? (
                paginatedData.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50/20 transition-colors duration-200">
                    <td className="py-4 px-6 text-[12px] font-normal whitespace-nowrap">{item.NISN}</td>
                    <td className="py-4 px-6 text-[13px] font-medium whitespace-nowrap max-w-[200px] truncate" title={item.nama_lengkap}>{item.nama_lengkap}</td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${isMale(item.jenis_kelamin) ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'}`}>
                          {displayGender(item.jenis_kelamin)}
                        </span>
                    </td>
                    <td className="py-4 px-6 text-[12px] font-normal whitespace-nowrap">{item.tempat_lahir}, {item.tanggal_lahir ? new Date(item.tanggal_lahir).toLocaleDateString('id-ID') : "-"}</td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gray-50 text-gray-500 capitalize">{item.tipe_siswa || "-"}</span>
                    </td>
                    <td className="py-4 px-6 text-center text-[12px] font-normal capitalize whitespace-nowrap">{item.jalur_pendaftaran}</td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${item.status_pembayaran === 'lunas' ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                            {item.status_pembayaran === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}
                        </span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                        <Link href={`/client/admin/DaftarSiswa/${item.id_siswa || item.id || item.NISN}`}>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Info size={18} /></button>
                        </Link>
                    </td>
                    </tr>
                ))
                ) : (
                <tr><td colSpan={8} className="py-20 text-center text-gray-400 text-sm italic">Data siswa tidak ditemukan</td></tr>
                )}
            </tbody>
            </table>
        </div>

        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50">
          <p className="text-[12px] text-gray-400 font-medium">
            {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} items
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30 cursor-pointer"><ChevronsLeft size={18}/></button>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30 cursor-pointer"><ChevronLeft size={18}/></button>
              <div className="flex items-center gap-2 px-2">
                {[...Array(totalPages)].map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentPage(idx + 1)} className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === idx + 1 ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:bg-gray-50'}`}>{idx + 1}</button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30 cursor-pointer"><ChevronRight size={18}/></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30 cursor-pointer"><ChevronsRight size={18}/></button>
            </div>
            <div className="text-[12px] text-gray-400 flex items-center gap-2">
               <div className="relative">
                  <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="appearance-none bg-transparent font-bold text-gray-600 pr-4 cursor-pointer focus:outline-none">
                    {[5, 10, 20, 50].map((val) => (<option key={val} value={val}>{val}</option>))}
                  </select>
                  <ChevronRight size={14} className="rotate-90 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"/>
               </div>
               <span className="ml-2">Items per page</span>
            </div>
          </div>
        </div>
      </div>
      <footer className="mt-8 text-[11px] text-gray-400 text-left">© MA PERSIS KUDANG</footer>
    </div>
  );
}

function StatCard({ label, value, icon, iconBg, iconColor }: any) {
  return (
    <div style={{ width: '268.25px', height: '108px' }} className="bg-white px-[20px] py-[24px] rounded-[12px] shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md text-left">
      <div className={`w-11 h-11 ${iconBg} ${iconColor} rounded-full flex items-center justify-center flex-shrink-0`}>{icon}</div>
      <div className="overflow-hidden">
        <p className="text-[18px] font-bold text-gray-800 leading-none truncate">{(value || 0).toLocaleString('id-ID')}</p>
        <p className="text-[10px] text-gray-400 mt-1 font-medium uppercase tracking-tight">{label}</p>
      </div>
    </div>
  );
}