"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  Check, X, Loader2, FileText, Download, 
  Calendar, ArrowUpRight, User, AlertCircle, Eye, Printer 
} from "lucide-react";
import ReceiptModal from "@/components/ui/ReceiptModal"; 

type ToastType = {
  message: string;
  type: "success" | "error";
};

export default function DetailPembayaranPage() {
  const { nisn } = useParams();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Nama Siswa
  const [namaSiswa, setNamaSiswa] = useState("Siswa");

  // --- STATE MODAL & TOAST ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<"Approved" | "Rejected" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<ToastType | null>(null);

  // --- STATE MODAL (RECEIPT & BUKTI TF) ---
  const [showReceipt, setShowReceipt] = useState(false);
  const [showBuktiModal, setShowBuktiModal] = useState(false); 

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- FETCH DATA TRANSAKSI ---
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

  // --- FETCH DATA SISWA ---
  useEffect(() => {
    if (nisn) {
      axios.get(`/server/api/admin/DaftarSiswa/${nisn}`)
        .then(res => {
          const detail = res.data.detailSiswa;
          if (detail && detail.nama_lengkap) {
            setNamaSiswa(detail.nama_lengkap);
          }
        })
        .catch(err => console.error("Gagal ambil nama siswa", err));
    }
  }, [nisn]);

  const totalNominal = items.reduce((acc, curr) => acc + curr.nominal, 0);
  const buktiTransfer = items.length > 0 ? items[0].bukti : null; 

  const isTransactionCompleted = items.length > 0 && items.every((item: any) => item.status === 'lunas' || item.status === 'ditolak');

  const handleOpenConfirm = (type: "Approved" | "Rejected") => {
    setConfirmActionType(type);
    setShowConfirmModal(true);
  };

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

      await Promise.allSettled(promises);

      setShowConfirmModal(false);
      showNotification(`Proses selesai. Data berhasil diperbarui.`, "success");

      setTimeout(() => {
          window.location.reload(); 
      }, 1000);

    } catch (error) {
      console.error("Error batch:", error);
      setShowConfirmModal(false);
      window.location.reload();
    } finally {
      setProcessing(false);
    }
  };

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
    <div className="ml-64 bg-gray-100 min-h-screen font-sans text-gray-800 relative ">
      
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
      {/* UPDATE: z-index diturunkan ke z-[1] dan ditambah bg-gray-100 agar tidak transparan */}
      <div className="border-b border-gray-100 px-8 py-6 sticky top-0 z-[1] bg-gray-100">
       <p className="text-[10px] text-gray-400 mb-2 tracking-widest">Pembayaran / <span className="text-green-600">Detail Pembayaran</span></p>
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Rincian Pembayaran</h1>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-2 mt-1">
                    <Calendar size={14} className="text-gray-300"/> 
                    {new Date(dateParam as string).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} WIB
                </p>
            </div>

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
            
          
            
            
            {isTransactionCompleted && (
                 <div className="flex items-center gap-2 px-6 py-2 bg-gray-50 text-gray-500 rounded-xl border border-gray-200 cursor-default">
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
                                Nama Siswa
                            </p>
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">
                                {namaSiswa}
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

            {/* KOLOM KANAN: BUKTI TRANSFER / E-RECEIPT (Sticky) */}
            <div className="w-full lg:w-[350px]">
                <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 sticky top-32">
                    
                    {/* Header Kolom Kanan */}
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-50">
                        {buktiTransfer ? (
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} className="text-[#068A50]"/> Bukti Transfer
                            </h3>
                        ) : (
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <Printer size={14} className="text-gray-800"/> E-Receipt
                            </h3>
                        )}

                        {buktiTransfer && (
                            <button onClick={handleDownloadBukti} className="text-[10px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer">
                                <Download size={12}/> Unduh File
                            </button>
                        )}
                    </div>

                    {/* Content Kolom Kanan */}
                    {buktiTransfer ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-[#F8F9FA] group">
                            <div className="aspect-[3/5] w-full relative">
                                <img src={buktiTransfer} alt="Bukti Transfer" className="w-full h-full object-contain p-2"/>
                            </div>
                            
                            <button 
                                onClick={() => setShowBuktiModal(true)} 
                                className="absolute inset-0 bg-white/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-zoom-in"
                            >
                                <span className="bg-white text-gray-800 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                    <ArrowUpRight size={14}/> Lihat Ukuran Penuh
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="h-48 flex flex-col items-center justify-center text-gray-400 bg-[#F8F9FA] rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                                <FileText size={24} className="text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">
                                Pembayaran ini dilakukan secara Tunai (Cash).
                            </p>
                            <button 
                                onClick={() => setShowReceipt(true)}
                                className="bg-gray-800 text-white px-6 py-2.5 rounded-lg text-xs font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                            >
                                <Eye size={14} /> Lihat E-Receipt
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* --- MODAL KONFIRMASI --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
           <div className="relative bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl text-center animate-in zoom-in duration-200">
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

      {/* --- MODAL E-RECEIPT --- */}
      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        data={{
            id_transaksi: items[0]?.id || "TRX-000", 
            nama_siswa: namaSiswa, // MENGGUNAKAN NAMA SISWA YANG BENAR
            nisn: typeof nisn === 'string' ? nisn : "-",
            tipe_pembayaran: items.map(i => i.nama || i.item).join(", ") || "Pembayaran Sekolah",
            nominal: totalNominal,
            tanggal: dateParam || new Date(),
            status: items[0]?.status || 'pending',
            operator: "Admin TU"
        }}
      />

      {/* --- MODAL IMAGE VIEWER (BUKTI TF) --- */}
      {showBuktiModal && buktiTransfer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            {/* Klik Backdrop buat tutup */}
            <div className="absolute inset-0" onClick={() => setShowBuktiModal(false)}></div>
            
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col items-center pointer-events-none">
                {/* Content Modal */}
                <div className="pointer-events-auto relative">
                    <button 
                        onClick={() => setShowBuktiModal(false)}
                        className="absolute -top-12 right-0 md:-right-12 text-white/80 hover:text-white transition-colors p-2 bg-white/10 rounded-full backdrop-blur-sm cursor-pointer"
                    >
                        <X size={24} />
                    </button>

                    <div className="bg-white p-2 rounded-xl shadow-2xl overflow-hidden w-auto h-auto flex items-center justify-center">
                        <img 
                            src={buktiTransfer} 
                            alt="Bukti Transfer Full" 
                            className="max-w-full max-h-[80vh] object-contain rounded-lg"
                        />
                    </div>
                    
                    <div className="mt-4 flex justify-center">
                        <button 
                            onClick={handleDownloadBukti}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-900 rounded-full text-xs font-bold shadow-lg hover:bg-gray-100 transition-all cursor-pointer"
                        >
                            <Download size={16} /> Unduh Gambar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}