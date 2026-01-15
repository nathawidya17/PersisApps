"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { 
  ChevronLeft, Search, MoreHorizontal, Eye, X, DownloadCloud 
} from "lucide-react";
import ReceiptModal from "@/components/ui/ReceiptModal"; 

export default function RiwayatTransaksiTagihanPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const id_siswa_param = params?.id;
  const id_jenis = searchParams.get("tagihan");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/server/api/admin/DaftarSiswa/riwayat-pembayaran-siswa/${id_siswa_param}?tagihan=${id_jenis}`);
        setData(res.data);
      } catch (err) {
        console.error("Gagal memuat riwayat", err);
      } finally {
        setLoading(false);
      }
    };
    if (id_siswa_param && id_jenis) fetchRiwayat();
  }, [id_siswa_param, id_jenis]);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  };

  // --- HANDLER SHOW MODAL ---
  const handleShowBukti = (item: any) => {
    setActiveMenu(null);
    if (!item) return;
    
    // Mapping data agar sesuai dengan props 'data' di ReceiptModal
    // Ini menyesuaikan dengan struktur yang Abang pakai di DetailPembayaranPage
    setSelectedTransaction({
        id_transaksi: item.id || "TRX-000",
        nama_siswa: item.nama_siswa || "Siswa",
        nisn: item.nisn_siswa || "-",
        tipe_pembayaran: data?.infoTagihan?.nama_pembayaran || "Pembayaran Sekolah",
        nominal: item.nominal,
        tanggal: item.tanggal,
        status: item.status,
        operator: item.approved_by || "Admin TU",
        metode_pembayaran: item.metode_pembayaran,
        bukti_pembayaran: item.bukti_pembayaran
    });
    setShowModal(true);
  };

  if (loading) return <div className="ml-64 p-10 font-sans text-gray-400 text-center uppercase tracking-widest text-[10px]">Memuat riwayat transaksi...</div>;

  const totalTagihan = Number(data?.infoTagihan?.nominal) || 0;
  const totalTerbayar = data?.riwayat?.filter((r: any) => ['lunas', 'cicil'].includes(r.status))
                        .reduce((acc: number, curr: any) => acc + Number(curr.nominal), 0) || 0;
  const sisaTagihan = Math.max(0, totalTagihan - totalTerbayar);
  const isLunas = totalTerbayar >= totalTagihan && totalTagihan > 0;

  return (
    <div className="ml-64 bg-gray-100 min-h-screen pb-10 px-5 pt-5 font-sans antialiased text-left relative">
      {/* Breadcrumb */}
      <div className="text-[10px] text-gray-400 mb-3 tracking-widest font-bold">
        Daftar Siswa / Detail Siswa / <span className="text-green-600">Detail Tagihan</span>
      </div>

      <button onClick={() => router.back()} className="flex items-center gap-2 mb-8 hover:opacity-70 transition-all cursor-pointer">
        <ChevronLeft size={22} className="text-gray-700" />
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{data?.infoTagihan?.nama_pembayaran || "Detail Pembayaran"}</h2>
      </button>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-5 mb-5">
        <SummaryCard label="Total Tagihan" value={formatIDR(totalTagihan)} />
        <SummaryCard label="Total Terbayar" value={formatIDR(totalTerbayar)} color="text-green-600" />
        <SummaryCard label="Sisa Tagihan" value={formatIDR(sisaTagihan)} color="text-red-600" />
        <SummaryCard label="Status" value={isLunas ? "Lunas" : "Belum Lunas"} color={isLunas ? "text-green-600" : "text-red-600"} bgColor={isLunas ? "bg-green-50" : "bg-red-50"} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        <div className="p-6 border-b border-gray-50 text-left">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Riwayat Transaksi Tagihan</h3>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-gray-50 bg-gray-50/30">
              <th className="px-8 py-5">Nominal</th>
              <th className="px-8 py-5">Metode</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Approved By</th>
              <th className="px-8 py-5">Tanggal</th>
              <th className="px-8 py-5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-[11px] text-gray-600">
            {data?.riwayat?.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-all">
                <td className="px-8 py-5 font-bold text-gray-800">{formatIDR(item.nominal)}</td>
                <td className="px-8 py-5 capitalize">{item.metode_pembayaran}</td>
                <td className="px-8 py-5 uppercase font-bold text-[10px]">
                    <span className={item.status === 'lunas' ? 'text-green-600' : 'text-yellow-600'}>
                        {item.status === 'belum' ? 'Pending' : item.status}
                    </span>
                </td>
                <td className="px-8 py-5 font-medium">{item.approved_by || "-"}</td>
                <td className="px-8 py-5 text-gray-400 text-[10px]">
                  {new Date(item.tanggal).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                </td>
                <td className="px-8 py-5 text-center relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === idx ? null : idx)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-300 hover:text-green-600 cursor-pointer"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {activeMenu === idx && (
                    <div className="absolute right-10 z-20 w-48 bg-white border border-gray-100 shadow-2xl rounded-xl py-2">
                      <button onClick={() => handleShowBukti(item)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold text-indigo-500 hover:bg-indigo-50 cursor-pointer">
                        <Eye size={14} /> Lihat Bukti / Struk
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

     {/* --- MODAL E-RECEIPT / BUKTI TRANSFER --- */}
{showModal && selectedTransaction && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    {/* Backdrop Gelap Blur */}
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowModal(false)}></div>
    
    {/* LOGIKA TAMPILAN BERDASARKAN METODE */}
    {selectedTransaction.metode_pembayaran === 'cash' ? (
      /* --- JIKA CASH: PANGGIL RECEIPT MODAL (UI STRUK PUTIH) --- */
      <div className="relative w-full max-w-[400px] animate-in zoom-in duration-200">
        <ReceiptModal 
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            data={selectedTransaction}
        />
      </div>
    ) : (
      /* --- JIKA TRANSFER: UI LIHAT BUKTI PERSIS SEPERTI GAMBAR --- */
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col items-center animate-in zoom-in duration-200">
        <div className="relative group">
          {/* Tombol Close di Atas Kanan Gambar */}
          <button 
            onClick={() => setShowModal(false)}
            className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors p-2 bg-white/10 rounded-full backdrop-blur-sm cursor-pointer"
          >
            <X size={24} />
          </button>

          {/* Container Gambar Putih */}
          <div className="bg-white p-2 rounded-xl shadow-2xl overflow-hidden flex items-center justify-center">
            <img 
              src={selectedTransaction.bukti_pembayaran} 
              alt="Bukti Transfer" 
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
          </div>
          
          {/* Tombol Unduh di Bawah Gambar */}
          <div className="mt-4 flex justify-center">
            <button 
              onClick={async () => {
                const response = await fetch(selectedTransaction.bukti_pembayaran);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `bukti_${selectedTransaction.nisn}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-900 rounded-full text-xs font-bold shadow-lg hover:bg-gray-100 transition-all cursor-pointer active:scale-95"
            >
              <DownloadCloud size={16} /> Unduh Gambar
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}

      <footer className="mt-10 text-[11px] text-gray-300 font-bold text-center tracking-widest uppercase text-left">© PERSIS 212 KUDANG</footer>
    </div>
  );
}

function SummaryCard({ label, value, color = "text-gray-800", bgColor = "bg-white" }: any) {
  return (
    <div className={`p-6 rounded-2xl border border-gray-50 shadow-sm ${bgColor} flex flex-col gap-1 text-left`}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}