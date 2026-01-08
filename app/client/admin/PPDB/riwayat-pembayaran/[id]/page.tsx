"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { 
  ChevronLeft, Search, Filter, Download, 
  MoreHorizontal, Trash2, Eye, X 
} from "lucide-react";

export default function RiwayatTransaksiTagihanPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Ambil ID dari params (Next.js Dynamic Route)
  const id_pendaftar = params?.id;
  const id_jenis = searchParams.get("tagihan");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk UI Pop-up & Modal
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedBukti, setSelectedBukti] = useState("");

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        setLoading(true);
        // Memanggil API Route Backend
        const res = await axios.get(`/server/api/admin/PPDB/riwayat-pembayaran/${id_pendaftar}?tagihan=${id_jenis}`);
        setData(res.data);
      } catch (err) {
        console.error("Gagal memuat riwayat", err);
      } finally {
        setLoading(false);
      }
    };
    if (id_pendaftar && id_jenis) fetchRiwayat();
  }, [id_pendaftar, id_jenis]);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  };

  const handleShowBukti = (fileName: string) => {
    setSelectedBukti(fileName);
    setShowModal(true);
    setActiveMenu(null); // Tutup dropdown setelah klik
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data transaksi ini?")) {
      console.log("Menghapus transaksi ID:", id);
      // Logic Delete API bisa diletakkan di sini
      setActiveMenu(null);
    }
  };

  if (loading) return <div className="ml-64 p-10 font-sans text-gray-400 text-center uppercase tracking-widest text-[10px]">Memuat riwayat transaksi...</div>;

  // Logic Perhitungan Ringkasan (Summary)
  const totalTagihan = Number(data?.infoTagihan?.nominal) || 0;
  const totalTerbayar = data?.riwayat?.filter((r: any) => r.status === 'lunas' || r.status === 'cicil')
                        .reduce((acc: number, curr: any) => acc + Number(curr.nominal), 0) || 0;
  const sisaTagihan = Math.max(0, totalTagihan - totalTerbayar);
  const isLunas = totalTerbayar >= totalTagihan && totalTagihan > 0;

  return (
    <div className="ml-64 bg-gray-100 min-h-screen pb-10 px-5 pt-5 font-sans antialiased text-left relative">
      {/* Breadcrumb */}
      <div className="text-[10px] text-gray-400 mb-3 tracking-widest uppercase font-bold">
        PPDB / Detail Calon Siswa / <span className="text-green-600">Detail Tagihan</span>
      </div>

      {/* Header */}
      <button onClick={() => router.back()} className="flex items-center gap-2 mb-8 hover:opacity-70 transition-all cursor-pointer">
        <ChevronLeft size={22} className="text-gray-700" />
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{data?.infoTagihan?.nama_pembayaran || "Detail Pembayaran"}</h2>
      </button>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-5 mb-5">
        <SummaryCard label="Total Tagihan" value={formatIDR(totalTagihan)} />
        <SummaryCard label="Total Terbayar" value={formatIDR(totalTerbayar)} color="text-green-600" />
        <SummaryCard label="Sisa Tagihan" value={formatIDR(sisaTagihan)} color="text-red-600" />
        <SummaryCard 
          label="Status" 
          value={isLunas ? "Lunas" : "Belum Lunas"} 
          color={isLunas ? "text-green-600" : "text-red-600"} 
          bgColor={isLunas ? "bg-green-50" : "bg-red-50"} 
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        <div className="p-6 border-b border-gray-50">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Riwayat Transaksi Tagihan</h3>
        </div>

        {/* Toolbar */}
        <div className="p-6 flex justify-between items-center bg-white gap-4">
          <div className="flex gap-4 flex-1">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input type="text" placeholder="Cari....." className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none focus:border-green-500 w-full" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-400 hover:bg-gray-50 transition-all cursor-pointer">
              <Filter size={16} /> Filter
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-400 hover:bg-gray-50 transition-all cursor-pointer">
            <Download size={16} /> Export Data
          </button>
        </div>

        {/* Table Content */}
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-gray-50 bg-gray-50/30">
              <th className="px-8 py-5">Nominal Pembayaran</th>
              <th className="px-8 py-5">Metode Pembayaran</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Approved By</th>
              <th className="px-8 py-5">Tanggal Pembayaran</th>
              <th className="px-8 py-5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-[11px] text-gray-600">
            {data?.riwayat?.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-all group">
                <td className="px-8 py-5 font-bold text-gray-800">{formatIDR(item.nominal)}</td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.metode_pembayaran === 'transfer' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="capitalize">{item.metode_pembayaran}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full font-bold text-[9px] uppercase ${item.status === 'menunggu' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                    {item.status === 'menunggu' ? 'Need Approval' : 'Approved'}
                  </span>
                </td>
                <td className="px-8 py-5 font-medium">{item.status === 'menunggu' ? '-' : (item.approved_by)}</td>
                <td className="px-8 py-5 text-gray-400 font-medium uppercase text-[10px]">
                  {new Date(item.created_at).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                </td>
                
                {/* AKSI DENGAN POPUP DROPDOWN */}
                <td className="px-8 py-5 text-center relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === idx ? null : idx)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-300 hover:text-green-600 cursor-pointer"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {activeMenu === idx && (
                    <>
                      {/* Click overlay to close dropdown */}
                      <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                      
                      {/* Dropdown Menu */}
                      <div className="absolute right-24 top-1/2 -translate-y-1/2 w-48 bg-white border border-gray-100 shadow-2xl rounded-xl py-2 z-20 animate-in fade-in zoom-in duration-150">
                        <button 
                          onClick={() => handleDelete(item.id_bayar_pendaftaran || item.id_pembayaran_daftar_ulang)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                        <button 
                          onClick={() => handleShowBukti(item.bukti_pembayaran)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold text-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer"
                        >
                          <Eye size={14} /> Lihat Bukti Pembayaran
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL VIEW BUKTI PEMBAYARAN */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-200 text-left">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preview Bukti Pembayaran</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-200 rounded-full transition-all cursor-pointer">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 flex justify-center bg-gray-100/30">
              {selectedBukti ? (
                <img 
                  // Pastikan file tersimpan di public/uploads/bukti/ agar bisa terpanggil via URL ini
                  src={`/uploads/bukti/${selectedBukti}`} 
                  alt="Bukti Transfer" 
                  className="max-h-[60vh] rounded-lg shadow-sm object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x500?text=Gambar+Tidak+Ditemukan";
                  }}
                />
              ) : (
                <div className="py-20 text-gray-400 text-[10px] font-bold uppercase tracking-widest italic">Bukti tidak tersedia</div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-10 text-[11px] text-gray-300 font-bold text-center tracking-widest uppercase">© PERSIS 212 KUDANG</footer>
    </div>
  );
}

function SummaryCard({ label, value, color = "text-gray-800", bgColor = "bg-white" }: any) {
  return (
    <div className={`p-6 rounded-2xl border border-gray-50 shadow-sm ${bgColor} flex flex-col gap-1`}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}