"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  Check, X, Loader2, FileText, Download, 
  Calendar, ArrowUpRight, Slash, Home, User, AlertCircle
} from "lucide-react";

// Tipe Data untuk Toast
type ToastType = {
  message: string;
  type: "success" | "error";
};

export default function DetailPembayaranPage() {
  const { nisn } = useParams();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE MODAL & TOAST ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<"Approved" | "Rejected" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<ToastType | null>(null);

  // --- HELPER NOTIFIKASI ---
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- FETCH DATA ---
  useEffect(() => {
    if (nisn && dateParam) {
      axios.post("/server/api/admin/pembayaran/detail", {
        nisn: nisn,
        date: dateParam
      })
      .then(res => {
        setItems(res.data.items);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        showNotification("Gagal memuat detail transaksi", "error");
        setLoading(false);
      });
    }
  }, [nisn, dateParam]);

  const totalNominal = items.reduce((acc, curr) => acc + curr.nominal, 0);
  const buktiTransfer = items.length > 0 ? items[0].bukti : null;

  // --- LOGIC PENGECEKAN STATUS ---
  // Cek apakah semua item sudah diproses (Lunas atau Ditolak)
  // Jika items masih kosong (loading), anggap belum selesai biar gak flickering
  const isTransactionCompleted = items.length > 0 && items.every((item: any) => item.status === 'lunas' || item.status === 'ditolak');

  // --- HANDLER BUTTON KLIK ---
  const handleOpenConfirm = (type: "Approved" | "Rejected") => {
    setConfirmActionType(type);
    setShowConfirmModal(true);
  };

  // --- LOGIC EKSEKUSI ---
  const executeBatchAction = async () => {
    if (!confirmActionType) return;
    setProcessing(true);

    try {
      const promises = items.map(item => {
        if (item.status === 'lunas' || item.status === 'ditolak') return Promise.resolve();
        return axios.patch("/server/api/admin/pembayaran", {
          id: item.id,
          type: item.type,
          status: confirmActionType,
          id_user_admin: 1 
        });
      });

      await Promise.all(promises);

      setShowConfirmModal(false);
      
      showNotification(`Transaksi berhasil di-${confirmActionType}`, "success");

      setTimeout(() => {
          // Refresh halaman atau redirect
          // Kita reload data aja biar status terupdate di UI tanpa pindah halaman
          window.location.reload(); 
          // atau router.push("/client/admin/pembayaran");
      }, 1500);

    } catch (error) {
      console.error("Error:", error);
      setShowConfirmModal(false);
      showNotification("Terjadi kesalahan sistem.", "error");
    } finally {
      setProcessing(false);
    }
  };

  // --- DOWNLOAD ---
  const handleDownloadBukti = async () => {
    if (!buktiTransfer) return;
    try {
      const response = await fetch(buktiTransfer);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bukti_${nisn}_${new Date().getTime()}.jpg`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Gagal download", error);
    }
  };

  if (loading) return <div className="ml-64 p-10 flex justify-center"><Loader2 className="animate-spin text-gray-400"/></div>;

  return (
    <div className="ml-64 bg-gray-50 min-h-screen font-sans text-gray-800 relative">
      
      {/* --- NOTIFICATION TOAST --- */}
      {notification && (
        <div className="fixed top-24 right-10 z-[999999] animate-in fade-in slide-in-from-right duration-300">
            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border bg-white ${
                notification.type === "success" ? "border-green-100" : "border-red-100"
            }`}>
                <div className={`p-2 rounded-full ${
                    notification.type === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}>
                    {notification.type === "success" ? <Check size={18} strokeWidth={3} /> : <AlertCircle size={18} strokeWidth={3} />}
                </div>
                <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${
                        notification.type === "success" ? "text-green-600" : "text-red-600"
                    }`}>
                        {notification.type === "success" ? "Berhasil" : "Gagal"}
                    </h4>
                    <p className="text-[13px] font-medium text-gray-600 max-w-[250px] leading-tight">
                        {notification.message}
                    </p>
                </div>
                <button onClick={() => setNotification(null)} className="ml-4 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X size={16} />
                </button>
            </div>
        </div>
      )}

      {/* --- HEADER SECTION --- */}
      <div className=" border-b border-gray-100 px-8 py-6 sticky top-0 z-10">
        <nav className="flex items-center gap-2 text-[11px] font-medium text-gray-400 mb-4">
            <button onClick={() => router.push('/client/admin/dashboard')} className="hover:text-green-600 transition-colors flex items-center gap-1">
             Dashboard
            </button>
            <Slash size={10} className="-rotate-12 opacity-50"/>
            <button onClick={() => router.push('/client/admin/pembayaran')} className="hover:text-green-600 transition-colors">
                Pembayaran
            </button>
            <Slash size={10} className="-rotate-12 opacity-50"/>
            <span className="text-green-600 font-bold  px-2 py-0.5 ">
                Detail Transaksi
            </span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Rincian Pembayaran</h1>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-2 mt-1">
                    <Calendar size={14} className="text-gray-300"/> 
                    {new Date(dateParam as string).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} WIB
                </p>
            </div>

            {/* ACTION BUTTONS (Disembunyikan jika transaksi selesai) */}
            {!isTransactionCompleted && (
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleOpenConfirm("Rejected")}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95 cursor-pointer"
                    >
                        <X size={16} strokeWidth={3} /> REJECT
                    </button>

                    <button 
                        onClick={() => handleOpenConfirm("Approved")}
                        className="flex items-center gap-2 px-8 py-2.5 bg-[#068A50] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#057a46] hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                        <Check size={16} strokeWidth={3} /> APPROVE
                    </button>
                </div>
            )}
            
            {/* TAMPILAN STATUS JIKA SELESAI (Opsional, biar area kanan gak kosong melompong) */}
            {isTransactionCompleted && (
                 <div className="flex items-center gap-2 px-6 py-2 bg-gray-50 text-gray-500 rounded-xl border border-gray-200">
                    <Check size={16} strokeWidth={3} className="text-green-600"/>
                    <span className="text-xs font-bold uppercase tracking-wider">Transaksi Selesai</span>
                 </div>
            )}
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
            {/* KOLOM KIRI: INFO UTAMA & TABEL */}
            <div className="flex-1 space-y-6">
                <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 p-1">
                    <div className="bg-[#FAFAFA] rounded-xl p-6 border-b border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Transaksi Masuk</p>
                        <h2 className="text-4xl font-bold text-gray-800 tracking-tight">
                            IDR {totalNominal.toLocaleString('id-ID')}
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-gray-50 p-4">
                        <div className="px-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <User size={12}/> NISN Siswa
                            </p>
                            <p className="text-base font-bold text-gray-700 font-mono">{nisn}</p>
                        </div>
                        <div className="px-4 text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                Jumlah Item
                            </p>
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">
                                {items.length} Pembayaran
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-white flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-800">Detail Item Tagihan</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#F8F9FA] text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-gray-50">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Nama Tagihan</th>
                                    <th className="px-6 py-4 font-bold text-center">Tipe</th>
                                    <th className="px-6 py-4 font-bold text-right">Nominal</th>
                                    <th className="px-6 py-4 font-bold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-gray-700">{item.nama || item.item}</p>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md uppercase tracking-wide">
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-bold text-gray-800">
                                        IDR {item.nominal.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                        item.status === 'lunas' ? 'bg-green-50 text-green-700 border-green-100' : 
                                        item.status === 'ditolak' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                    }`}>
                                        {item.status === 'lunas' ? 'Approved' : item.status === 'ditolak' ? 'Rejected' : 'Pending'}
                                    </span>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* KOLOM KANAN: BUKTI TRANSFER (Sticky) */}
            <div className="w-full lg:w-[350px]">
                <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 sticky top-32">
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-50">
                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={14} className="text-[#068A50]"/> Bukti Transfer
                        </h3>
                        {buktiTransfer && (
                            <button onClick={handleDownloadBukti} className="text-[10px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all">
                                <Download size={12}/> Unduh File
                            </button>
                        )}
                    </div>
                    {buktiTransfer ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-[#F8F9FA] group">
                        <div className="aspect-[3/5] w-full relative">
                            <img src={buktiTransfer} alt="Bukti Transfer" className="w-full h-full object-contain p-2"/>
                        </div>
                        <a href={buktiTransfer} target="_blank" rel="noreferrer" className="absolute inset-0 bg-white/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-zoom-in">
                            <span className="bg-white text-gray-800 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                <ArrowUpRight size={14}/> Lihat Ukuran Penuh
                            </span>
                        </a>
                    </div>
                    ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-gray-400 bg-[#F8F9FA] rounded-xl border-2 border-dashed border-gray-200">
                        <FileText size={32} className="mb-2 opacity-20"/>
                        <span className="text-xs font-medium opacity-50">Tidak ada bukti upload</span>
                    </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* --- MODAL KONFIRMASI (STYLE BARU) --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
           <div className="relative bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl text-center animate-in zoom-in duration-200">
              
              {/* IKON BESAR */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white ring-4 ${
                  confirmActionType === "Approved" ? "bg-[#FCD34D] ring-yellow-50" : "bg-[#9B1C1C] ring-red-50"
              }`}>
                 <span className="text-white text-4xl font-bold">
                    {confirmActionType === "Approved" ? "?" : "!"}
                 </span>
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {confirmActionType === "Approved" ? "Konfirmasi Approve" : "Konfirmasi Reject"}
              </h3>
              
              <p className="text-xs text-gray-500 mb-8 leading-relaxed px-4">
                  {confirmActionType === "Approved" 
                    ? "Apakah Anda yakin ingin menyetujui transaksi ini?" 
                    : "Apakah Anda yakin ingin menolak transaksi ini? Tindakan tidak bisa dibatalkan."}
              </p>

              <div className="flex gap-3">
                 <button 
                    onClick={() => setShowConfirmModal(false)} 
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
                 >
                    Batalkan
                 </button>
                 
                 <button 
                    onClick={executeBatchAction} 
                    disabled={processing}
                    className={`flex-1 py-2.5 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer flex justify-center items-center gap-2 ${
                        confirmActionType === "Approved" 
                            ? "bg-[#FBBF24] hover:bg-[#F59E0B]" 
                            : "bg-[#9B1C1C] hover:bg-[#7f1616]"
                    }`}
                 >
                    {processing && <Loader2 size={12} className="animate-spin"/>}
                    {confirmActionType === "Approved" ? "Ya, Approve" : "Ya, Reject"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}