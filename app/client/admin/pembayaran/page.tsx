"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Trash2,
  Eye,
  Loader2,
  DownloadCloud, 
} from "lucide-react";
import axios from "axios";

export default function PembayaranAdminPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE FILTERING ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTagihan, setFilterTagihan] = useState("Semua");
  const [tagihanOptions, setTagihanOptions] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // State UI: Modals
  const [showModal, setShowModal] = useState(false);
  const [selectedBukti, setSelectedBukti] = useState(""); 
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // State Action & Notification
  const [pendingAction, setPendingAction] = useState<{
    id: number;
    type: string;
    action: "Approved" | "Rejected" | "Delete";
  } | null>(null);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      const response = await axios.get("/server/api/admin/pembayaran");
      
      const needApprovalData = response.data.filter(
        (item: any) =>
          item.status === "Need Approval" ||
          item.status === "Rejected" || // Tampilkan yang ditolak juga
          item.status_db === "belum" ||
          item.status_db === "menunggu"
      );
      setData(needApprovalData);

      const uniqueTagihan = Array.from(new Set(needApprovalData.map((item: any) => item.tagihan))) as string[];
      setTagihanOptions(uniqueTagihan.sort()); 

      setLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIC FILTERING ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.NISN?.includes(searchTerm);

      const matchTagihan = filterTagihan === "Semua" || item.tagihan === filterTagihan;

      return matchSearch && matchTagihan;
    });
  }, [data, searchTerm, filterTagihan]);

  // --- PAGINATION ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTagihan, itemsPerPage]);

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- HANDLERS ---
  const handleShowBukti = (buktiUrl: string | null) => {
    setOpenMenuId(null);
    if (!buktiUrl) {
        setNotification({ message: "Bukti pembayaran tidak tersedia.", type: "error" });
        setTimeout(() => setNotification(null), 3000);
        return;
    }
    setSelectedBukti(buktiUrl); 
    setShowModal(true);
  };

  const handleDownloadBukti = async () => {
    if (!selectedBukti) return;
    try {
      const response = await fetch(selectedBukti);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = selectedBukti.split('/').pop() || 'bukti-pembayaran.jpg';
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Gagal mendownload gambar.");
    }
  };
  
  // Trigger Delete
  const handleDeleteClick = (id: number, type: string) => {
    setOpenMenuId(null);
    setPendingAction({ id, type, action: "Delete" });
    setShowDeleteModal(true);
  };

  // Trigger Approval/Reject
  const handleApprovalClick = (id: number, type: string, action: "Approved" | "Rejected") => {
    setPendingAction({ id, type, action });
    setShowConfirmModal(true);
  };

  const executeApproval = async () => {
    if (!pendingAction) return;
    const loggedInAdminId = typeof window !== "undefined" ? localStorage.getItem("id_user") : null;

    try {
      await axios.patch("/server/api/admin/pembayaran", {
        id: pendingAction.id,
        type: pendingAction.type,
        status: pendingAction.action,
        id_user_admin: loggedInAdminId,
      });
      setShowConfirmModal(false);
      setNotification({
        message: pendingAction.action === "Approved" ? "Pembayaran berhasil disetujui!" : "Pembayaran telah ditolak.",
        type: "success"
      });
      setPendingAction(null);
      await fetchData();
    } catch (error) {
      setShowConfirmModal(false);
      setNotification({ message: "Gagal memproses data.", type: "error" });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const executeDelete = async () => {
    if (!pendingAction) return;
    
    try {
      await axios.delete("/server/api/admin/pembayaran", {
        data: { id: pendingAction.id, type: pendingAction.type }
      });
      
      setShowDeleteModal(false);
      setNotification({ message: "Data berhasil dihapus.", type: "success" });
      setPendingAction(null);
      await fetchData();
    } catch (error) {
      setShowDeleteModal(false);
      setNotification({ message: "Gagal menghapus data.", type: "error" });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) return (
      <div className="ml-64 p-10 font-light text-gray-400 flex items-center gap-3">
        <Loader2 className="animate-spin" /> Memuat Data Pembayaran...
      </div>
  );

  return (
    <div className="ml-64 bg-gray-100 min-h-screen pb-10 px-5 pt-5 antialiased font-sans text-left relative">
      
      {/* Toast Notification */}
      {notification && (
        <div 
            className="fixed z-[999999] pointer-events-none animate-in fade-in slide-in-from-right duration-900"
            style={{ top: '90px', left: 'calc(80.5% + 130px)', transform: 'translateX(-50%)' }}
        >
            <div className={`flex items-center gap-3 px-4 py-5 rounded-xl shadow-lg border bg-white pointer-events-auto ${notification.type === "success" ? "border-green-100" : "border-red-100"}`}>
            <div className={notification.type === "success" ? "text-green-600" : "text-red-600"}>
                {notification.type === "success" ? <Check size={16} strokeWidth={4} /> : <X size={16} strokeWidth={4} />}
            </div>
            <p className="text-[12px] font-bold text-gray-700 whitespace-nowrap tracking-tight">{notification.message}</p>
            <div className="w-[1px] h-3 bg-gray-200 ml-1"></div>
            <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5 transition-colors"><X size={14} /></button>
            </div>
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-800 mb-5">Pembayaran</h2>

      <div className="bg-white p-6 rounded-[12px] shadow-sm border border-gray-100 mb-5">
        
        {/* --- TOOLBAR --- */}
        <div className="flex flex-col md:flex-row justify-between gap-5 mb-6">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Cari....." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="relative">
              <select className="appearance-none pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-[8px] text-sm text-gray-600 focus:outline-none cursor-pointer hover:bg-gray-50 transition-all min-w-[180px]" value={filterTagihan} onChange={(e) => setFilterTagihan(e.target.value)}>
                <option value="Semua">Semua Tagihan</option>
                {tagihanOptions.map((tagihan, idx) => (<option key={idx} value={tagihan}>{tagihan}</option>))}
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-2 border border-gray-200 rounded-[8px] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">
            <Download size={18} /> Export Data
          </button>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[#94A3B8] border-b border-gray-50 text-[11px] tracking-normal">
                <th className="py-4 px-3 font-normal text-left whitespace-nowrap">NISN</th>
                <th className="py-4 px-3 font-normal text-left whitespace-nowrap">Nama Siswa</th>
                <th className="py-4 px-3 font-normal text-left whitespace-nowrap">Tagihan</th>
                <th className="py-4 px-3 font-normal text-left whitespace-nowrap">Nominal Tagihan</th>
                <th className="py-4 px-3 font-normal text-left whitespace-nowrap">Nominal Bayar</th>
                <th className="py-4 px-3 text-center font-normal whitespace-nowrap">Status</th>
                <th className="py-4 px-3 font-normal text-left whitespace-nowrap">Tanggal</th>
                <th className="py-4 px-3 text-center font-normal whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[#3b3b3b]">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/20 transition-colors duration-200">
                    <td className="py-4 px-3 text-[12px] whitespace-nowrap">{item.NISN}</td>
                    <td className="py-4 px-3 text-[12px] font-medium capitalize align-middle"><div className="line-clamp-2 leading-snug w-[140px]">{item.nama_siswa}</div></td>
                    <td className="py-4 px-3 text-[12px] text-gray-600 whitespace-nowrap">{item.tagihan}</td>
                    <td className="py-4 px-3 text-[12px] whitespace-nowrap text-gray-400 italic">IDR {item.nominal_tagihan?.toLocaleString("id-ID")}</td>
                    <td className="py-4 px-3 text-[12px] font-bold whitespace-nowrap text-[#2D6A4F]">IDR {item.nominal?.toLocaleString("id-ID")}</td>
                    
                    {/* Status Display */}
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                        {item.status === 'Rejected' ? (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-500">Rejected</span>
                        ) : (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-400">Need Approval</span>
                        )}
                    </td>
                    
                    <td className="py-4 px-3 text-[11px] text-gray-500 whitespace-nowrap">{item.tanggal_pembayaran}</td>
                    <td className="py-4 px-3 text-center whitespace-nowrap overflow-visible">
                      <div className="flex items-center justify-center gap-2">
                        {/* Approve Button */}
                        <button onClick={() => handleApprovalClick(item.id, item.type, "Approved")} className="text-green-600 hover:text-green-800 transition-all active:scale-90 cursor-pointer"><Check size={20} strokeWidth={3} /></button>
                        
                        {/* Reject Button */}
                        <button onClick={() => handleApprovalClick(item.id, item.type, "Rejected")} className="text-red-500 hover:text-red-700 transition-all active:scale-90 cursor-pointer"><X size={20} strokeWidth={3} /></button>
                        
                        <div className="relative">
                          <button id={`btn-aksi-${item.id}`} onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 cursor-pointer"><MoreHorizontal size={20} /></button>
                          {openMenuId === item.id && (
                            <>
                              <div className="fixed inset-0 z-[998]" onClick={() => setOpenMenuId(null)}></div>
                              <div className="fixed z-[999] w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-150" style={{ top: typeof window !== "undefined" ? (document.getElementById(`btn-aksi-${item.id}`)?.getBoundingClientRect().bottom ?? 0) + 8 : 0, left: typeof window !== "undefined" ? (document.getElementById(`btn-aksi-${item.id}`)?.getBoundingClientRect().left ?? 0) - 160 : 0 }}>
                                <button onClick={() => handleDeleteClick(item.id, item.type)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold text-red-500 hover:bg-red-50 transition-all cursor-pointer"><Trash2 size={14} /> Hapus</button>
                                <button onClick={() => handleShowBukti(item.bukti_pembayaran)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold text-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer"><Eye size={14} /> Lihat Bukti Pembayaran</button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="py-20 text-center text-gray-400 font-medium text-sm italic">Data Pembayaran Tidak Ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL APPROVE / REJECT */}
        {showConfirmModal && pendingAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowConfirmModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in duration-200 text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${pendingAction.action === "Approved" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                {pendingAction.action === "Approved" ? <Check size={32} /> : <X size={32} />}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{pendingAction.action === "Approved" ? "Setujui Pembayaran?" : "Tolak Pembayaran?"}</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                {pendingAction.action === "Approved" 
                    ? "Tindakan ini akan memverifikasi pembayaran menjadi lunas." 
                    : "Tindakan ini akan menolak pembayaran dan mengubah status menjadi ditolak."}
                <br/>Apakah Anda yakin?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">Batal</button>
                <button onClick={executeApproval} className={`flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#ffffff] ${pendingAction.action === "Approved" ? "bg-[#068A50] hover:bg-green-700 shadow-green-200" : "bg-red-600 hover:bg-red-700 shadow-red-200"}`}>
                    {pendingAction.action === "Approved" ? "Ya, Setujui" : "Ya, Tolak"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DELETE */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDeleteModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in duration-200 text-center">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100 text-red-600">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus Data Pembayaran?</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Apakah Anda yakin ingin menghapus data ini secara permanen?
                <br/><span className="text-red-500 font-bold text-xs">Tindakan ini tidak dapat dibatalkan.</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">Batal</button>
                <button onClick={executeDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-lg active:scale-95 cursor-pointer">
                    Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL VIEW BUKTI */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in duration-200 text-left flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Eye size={14}/> Preview Bukti Pembayaran
                </h3>
                <div className="flex items-center gap-2">
                    <button onClick={handleDownloadBukti} className="flex items-center gap-2 px-3 py-1.5 bg-[#2D6A4F] text-white text-[10px] font-bold rounded-lg hover:bg-[#1f4e3a] transition-all cursor-pointer shadow-sm active:scale-95">
                        <DownloadCloud size={14} /> Download
                    </button>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-all cursor-pointer text-gray-400"><X size={20} /></button>
                </div>
              </div>
              <div className="p-0 bg-black flex justify-center items-center h-full overflow-auto">
                {selectedBukti ? (
                  <img src={selectedBukti} alt="Bukti Transfer" className="max-w-full max-h-[75vh] object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/600x400?text=Gambar+Tidak+Ditemukan/Path+Salah"; }}/>
                ) : (
                  <div className="py-32 text-gray-500 text-xs font-bold uppercase tracking-widest italic text-center w-full bg-gray-100">Bukti tidak tersedia</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 bg-white relative z-10">
          <p className="text-[12px] text-gray-400 font-medium">{filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} items</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-1 text-gray-300 hover:text-[#2D6A4F] disabled:opacity-30 cursor-pointer"><ChevronsLeft size={18} /></button>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="p-1 text-gray-300 hover:text-[#2D6A4F] disabled:opacity-30 cursor-pointer"><ChevronLeft size={18} /></button>
              <div className="flex items-center gap-2 px-2">
                {[...Array(totalPages)].map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentPage(idx + 1)} className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === idx + 1 ? "bg-green-50 text-green-600" : "text-gray-400 hover:bg-gray-50"}`}>{idx + 1}</button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="p-1 text-gray-300 hover:text-[#2D6A4F] disabled:opacity-30 cursor-pointer"><ChevronRight size={18} /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="p-1 text-gray-300 hover:text-[#2D6A4F] disabled:opacity-30 cursor-pointer"><ChevronsRight size={18} /></button>
            </div>
            <div className="text-[12px] text-gray-400 flex items-center gap-2">
              <div className="relative flex items-center">
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="appearance-none bg-transparent font-bold text-gray-600 pr-5 cursor-pointer focus:outline-none">
                  {[5, 10, 20, 50].map((val) => (<option key={val} value={val}>{val}</option>))}
                </select>
                <ChevronRight size={14} className="rotate-90 absolute right-0 pointer-events-none text-gray-400" />
              </div>
              <span className="ml-1">Items per page</span>
            </div>
          </div>
        </div>
      </div>
      <footer className="mt-8 text-[11px] text-gray-400 uppercase tracking-widest text-left">© Persis 212 Kudang</footer>
    </div>
  );
}