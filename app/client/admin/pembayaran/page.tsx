"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Eye, Download, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx"; 

export default function PembayaranPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // --- STATE PAGINATION UTAMA (DAFTAR TRANSAKSI) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("/server/api/admin/pembayaran/group");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- FILTER & SORT DATA ---
  const filteredData = data
    .filter(item => 
      item.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nisn.includes(searchTerm)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- LOGIC PAGINATION UTAMA ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMainItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalMainPages = Math.ceil(filteredData.length / itemsPerPage);

  // --- GROUPING DATA UNTUK REKAP ---
  const paymentTypeGroups: { [key: string]: any[] } = {};
  filteredData.forEach((transaction) => {
    const itemsString = transaction.list_items || "Lainnya";
    const items = itemsString.split(',').map((s: string) => s.trim());
    items.forEach((itemName: string) => {
      const cleanName = itemName.replace(/^\d+\s*x\s*/i, ""); 
      if (!paymentTypeGroups[cleanName]) paymentTypeGroups[cleanName] = [];
      paymentTypeGroups[cleanName].push(transaction);
    });
  });

  const sortedPaymentTypes = Object.keys(paymentTypeGroups).sort();

  // --- EXPORT 1: DAFTAR TRANSAKSI (BUTTON ATAS) ---
  const handleExportMain = () => {
    if (filteredData.length === 0) return alert("Tidak ada data");
    
    const exportData = filteredData.map((item, index) => ({
        "No": index + 1,
        "Waktu": new Date(item.date).toLocaleDateString('id-ID'),
        "Jam": new Date(item.date).toLocaleTimeString('id-ID'),
        "NISN": item.nisn,
        "Nama Siswa": item.nama_siswa,
        "Jumlah Item": item.jumlah_item,
        "Rincian": item.list_items || "-", 
        "Metode": (item.metode || "Cash").toUpperCase(),
        "Nominal": item.total_nominal,
        "Status Verifikasi": item.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
    XLSX.writeFile(wb, `Transaksi_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // --- EXPORT 2: REKAPITULASI KHUSUS (FIXED: HEADER MUNCUL) ---
  const handleExportRekap = () => {
    if (sortedPaymentTypes.length === 0) return alert("Tidak ada data rekap");

    const sheetData: any[] = [];
    
    sortedPaymentTypes.forEach(type => {
        // 1. Judul Grup
        sheetData.push(["DATA TAGIHAN " + type.toUpperCase()]); 
        
        // 2. Header Kolom (INI YANG TADI HILANG)
        sheetData.push(["ID TRANSAKSI", "NAMA SISWA", "METODE", "TOTAL BAYAR (IDR)", "STATUS", "TANGGAL BAYAR"]); 

        // 3. Isi Data
        paymentTypeGroups[type].forEach(item => {
            const dateObj = new Date(item.date);
            sheetData.push([
                item.group_id, 
                item.nama_siswa,
                (item.metode || "CASH").toUpperCase(),
                item.total_nominal, // Total Bayar
                item.status,        // Status
                dateObj.toLocaleDateString('id-ID') + ' ' + dateObj.toLocaleTimeString('id-ID')
            ]);
        });

        // Spasi antar grup
        sheetData.push([]); 
        sheetData.push([]); 
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    // Atur Lebar Kolom Biar Rapi
    ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 25 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap_Pembayaran");
    XLSX.writeFile(wb, `Rekap_Pembayaran_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading) return <div className="ml-64 p-10 flex justify-center"><Loader2 className="animate-spin text-gray-400"/></div>;

  return (
    <div className="ml-64 bg-gray-100 min-h-screen p-8 font-sans">
      
      {/* === TABEL 1: DAFTAR TRANSAKSI MASUK === */}
      <h2 className="text-xl font-bold text-gray-800 mb-6">Daftar Transaksi Masuk</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-12">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-50 flex justify-between">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16}/>
              <input 
                type="text" 
                placeholder="Cari Siswa / NISN..." 
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              />
           </div>
           <button onClick={handleExportMain} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors active:scale-95 cursor-pointer">
             <Download size={16}/> Export Transaksi
           </button>
        </div>

        {/* Table Main */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50">
              <tr className="border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                <th className="py-4 px-6">NISN</th>
                <th className="py-4 px-6">Siswa</th>
                <th className="py-4 px-6 text-center">Waktu</th>
                <th className="py-4 px-6 text-center">Metode</th>
                <th className="py-4 px-6 text-center">Item</th>
                <th className="py-4 px-6 text-left">Nominal</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[12px] text-gray-600">
              {currentMainItems.map((item, index) => (
                <tr key={item.group_id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-500 font-mono">{item.nisn}</td>
                  <td className="py-4 px-6">{item.nama_siswa}</td>
                  <td className="py-4 px-6 text-center">{new Date(item.date).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}</td>
                  <td className="py-4 px-6 text-center"><BadgeMetode metode={item.metode} /></td>
                  <td className="py-4 px-6 text-center"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{item.jumlah_item} Item</span></td>
                  <td className="py-4 px-6">IDR {(item.total_nominal || 0).toLocaleString('id-ID')}</td>
                  <td className="py-4 px-6 text-center"><StatusBadge status={item.status} /></td>
                  <td className="py-4 px-6 text-center">
                    <button onClick={() => router.push(`/client/admin/pembayaran/${item.nisn}?date=${item.date}`)} className="p-2 hover:bg-green-50 text-green-600 rounded-lg"><Eye size={18} /></button>
                  </td>
                </tr>
              ))}
              {currentMainItems.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">Data tidak ditemukan</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Main */}
        <PaginationFooter 
          currentPage={currentPage} 
          totalPages={totalMainPages} 
          itemsPerPage={itemsPerPage} 
          totalItems={filteredData.length} 
          onPageChange={setCurrentPage} 
          onLimitChange={(val: number) => setItemsPerPage(val)} 
        />
      </div>

      {/* === TABEL 2: REKAPITULASI PER JENIS === */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-8 mb-6">
         <h2 className="text-xl font-bold text-gray-800">Rekapitulasi Per Jenis Pembayaran</h2>
         <button 
           onClick={handleExportRekap}
           className="flex items-center gap-2 px-4 py-2 bg-[#068A50] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#057a46] transition-colors active:scale-95 cursor-pointer"
         >
           <Download size={16}/> Export Data Rekap
         </button>
      </div>
      
      <div className="grid grid-cols-1 gap-8 mb-8">
        {sortedPaymentTypes.map((type) => (
           <RekapTable 
             key={type} 
             type={type} 
             transactions={paymentTypeGroups[type]} 
           />
        ))}
        {sortedPaymentTypes.length === 0 && <div className="p-8 text-center bg-white border border-dashed rounded-xl text-gray-400">Belum ada data rekap.</div>}
      </div>

      <footer className="mt-8 text-[11px] text-gray-400 text-left">© MA PERSIS KUDANG</footer>
    </div>
  );
}

// --- KOMPONEN BARU: TABLE PER JENIS PEMBAYARAN (INDEPENDENT PAGINATION) ---
function RekapTable({ type, transactions }: { type: string, transactions: any[] }) {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);

    const indexOfLast = page * limit;
    const indexOfFirst = indexOfLast - limit;
    const currentData = transactions.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(transactions.length / limit);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                    <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{type}</h4>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                    {transactions.length} Transaksi
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/30">
                        <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-gray-50">
                            <th className="py-3 px-6 w-1/4">Siswa</th>
                            <th className="py-3 px-6 text-center">Waktu Bayar</th>
                            <th className="py-3 px-6 text-center">Metode</th>
                            <th className="py-3 px-6 text-right">Total Bayar</th>
                            <th className="py-3 px-6 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[12px] text-gray-600">
                        {currentData.map((item, idx) => (
                            <tr key={`${type}-${item.group_id}-${idx}`} className="hover:bg-gray-50">
                                <td className="py-3 px-6 font-medium">
                                    {item.nama_siswa} <br /><span className="text-gray-400 font-mono text-[10px] font-normal">{item.nisn}</span>
                                </td>
                                <td className="py-3 px-6 text-center whitespace-nowrap">
                                    {new Date(item.date).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="py-3 px-6 text-center"><BadgeMetode metode={item.metode} /></td>
                                <td className="py-3 px-6 text-right font-medium text-gray-700">
                                    IDR {(item.total_nominal || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="py-3 px-6 text-center"><StatusBadge status={item.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PaginationFooter 
                currentPage={page}
                totalPages={totalPages}
                itemsPerPage={limit}
                totalItems={transactions.length}
                onPageChange={setPage}
                onLimitChange={(val: number) => { setLimit(val); setPage(1); }}
            />
        </div>
    );
}

// --- SUB COMPONENTS (UI HELPERS) ---

function BadgeMetode({ metode }: { metode: string }) {
  const isTransfer = metode?.toLowerCase() === 'transfer';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${isTransfer ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
      {metode || 'Cash'}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = { 'Need Approval': 'bg-yellow-50 text-yellow-600', 'Approved': 'bg-green-50 text-green-600', 'Rejected': 'bg-red-50 text-red-600', 'Menunggu': 'bg-gray-50 text-gray-500' };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${styles[status] || styles['Menunggu']}`}>{status}</span>;
}

// --- REUSABLE PAGINATION COMPONENT ---
function PaginationFooter({ currentPage, totalPages, itemsPerPage, totalItems, onPageChange, onLimitChange }: any) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50">
      <p className="text-[12px] text-gray-400 font-medium">
        {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
      </p>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1">
          <button disabled={currentPage === 1} onClick={() => onPageChange(1)} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30 cursor-pointer"><ChevronsLeft size={18}/></button>
          <button disabled={currentPage === 1} onClick={() => onPageChange((p: number) => Math.max(1, p - 1))} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30 cursor-pointer"><ChevronLeft size={18}/></button>
          <div className="flex items-center gap-2 px-2">
            {[...Array(totalPages)].map((_, idx) => {
               if (totalPages > 5 && Math.abs(idx + 1 - currentPage) > 2) return null; 
               return (
                <button key={idx} onClick={() => onPageChange(idx + 1)} className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === idx + 1 ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:bg-gray-50'}`}>{idx + 1}</button>
               )
            })}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => onPageChange((p: number) => Math.min(totalPages, p + 1))} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30 cursor-pointer"><ChevronRight size={18}/></button>
          <button disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)} className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-30 cursor-pointer"><ChevronsRight size={18}/></button>
        </div>
        <div className="text-[12px] text-gray-400 flex items-center gap-2">
           <div className="relative">
              <select value={itemsPerPage} onChange={(e) => onLimitChange(Number(e.target.value))} className="appearance-none bg-transparent font-bold text-gray-600 pr-4 cursor-pointer focus:outline-none">
                {[5, 10, 20, 50].map((val) => (<option key={val} value={val}>{val}</option>))}
              </select>
              <ChevronRight size={14} className="rotate-90 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"/>
           </div>
           <span className="ml-2">Items per page</span>
        </div>
      </div>
    </div>
  );
}