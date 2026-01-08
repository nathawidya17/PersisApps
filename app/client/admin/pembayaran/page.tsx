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
} from "lucide-react";
import axios from "axios";

export default function PembayaranAdminPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // State UI: Modals
  const [showModal, setShowModal] = useState(false);
  const [selectedBukti, setSelectedBukti] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // State UI: Notifications (Toast)
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [pendingApproval, setPendingApproval] = useState<{
    id: number;
    type: string;
    status: "Approved" | "Rejected";
  } | null>(null);

  const fetchData = async () => {
    try {
      const response = await axios.get("/server/api/admin/pembayaran");
      const needApprovalData = response.data.filter(
        (item: any) =>
          item.status === "Need Approval" ||
          item.status === "belum" ||
          item.status === "menunggu"
      );
      setData(needApprovalData);
      setLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler Lihat Bukti
  const handleShowBukti = (fileName: string) => {
    setSelectedBukti(fileName);
    setShowModal(true);
    setOpenMenuId(null);
  };

  // Handler Hapus
  const handleDelete = (id: number) => {
    setOpenMenuId(null);
    if (confirm("Apakah Anda yakin ingin menghapus data transaksi ini?")) {
      console.log("Menghapus transaksi ID:", id);
      setNotification({ message: "Data berhasil dihapus!", type: "success" });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Handler Klik Tombol Approval (Munculkan Modal)
  const handleApprovalClick = (id: number, type: string, status: "Approved" | "Rejected") => {
    setPendingApproval({ id, type, status });
    setShowConfirmModal(true);
  };

  // Eksekusi Approval dari Modal
  const executeApproval = async () => {
    if (!pendingApproval) return;

    const loggedInAdminId = typeof window !== "undefined" ? localStorage.getItem("id_user") : null;

    try {
      await axios.patch("/server/api/admin/pembayaran", {
        id: pendingApproval.id,
        type: pendingApproval.type,
        status: pendingApproval.status,
        id_user_admin: loggedInAdminId,
      });

      // Tutup modal konfirmasi
      setShowConfirmModal(false);

      // Tampilkan notifikasi sukses
      setNotification({
        message: pendingApproval.status === "Approved" 
          ? "Pembayaran berhasil disetujui!" 
          : "Pembayaran berhasil ditolak.",
        type: "success"
      });

      setPendingApproval(null);
      await fetchData();

      // Hilangkan notifikasi otomatis setelah 3 detik
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setShowConfirmModal(false);
      setNotification({ message: "Gagal memproses data.", type: "error" });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.NISN?.includes(searchTerm)
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading)
    return (
      <div className="ml-64 p-10 font-light text-gray-400 flex items-center gap-3">
        <Loader2 className="animate-spin" /> Memuat Data Pembayaran...
      </div>
    );

  return (
    <div className="ml-64 bg-gray-100 min-h-screen pb-10 px-5 pt-5 antialiased font-sans text-left relative">


{/* TOAST NOTIFICATION - TEPAT DI BAWAH NAVBAR & TENGAH CONTENT */}
{notification && (
  <div 
    className="fixed z-[999999] pointer-events-none animate-in fade-in slide-in-from-right duration-900"
    style={{ 
      top: '90px', // Sela-sela tepat di bawah navbar (h-20 = 80px + margin 5px)
      left: 'calc(79% + 129px)', // Menyesuaikan titik tengah layar dikurangi lebar sidebar
      transform: 'translateX(-50%)' 
    }}
  >
    <div className={`flex items-center gap-3 px-4 py-5 rounded-xl shadow-lg border bg-white pointer-events-auto ${
      notification.type === "success" ? "border-green-100" : "border-red-100"
    }`}>
      {/* Icon */}
      <div className={notification.type === "success" ? "text-green-600" : "text-red-600"}>
        {notification.type === "success" ? <Check size={16} strokeWidth={4} /> : <X size={16} strokeWidth={4} />}
      </div>

      {/* Teks */}
      <p className="text-[12px] font-bold text-gray-700 whitespace-nowrap tracking-tight">
        {notification.message}
      </p>

      {/* Divider & Close */}
      <div className="w-[1px] h-3 bg-gray-200 ml-1"></div>
      <button 
        onClick={() => setNotification(null)} 
        className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  </div>
)}
      <h2 className="text-xl font-bold text-gray-800 mb-5">Pembayaran</h2>

      <div className="bg-white p-6 rounded-[12px] shadow-sm border border-gray-100 mb-5">
        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row justify-between gap-5 mb-6">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari....."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-[8px] text-sm text-gray-500 hover:bg-gray-100 transition-all cursor-pointer">
              <Filter size={16} /> <span className="font-medium">Filter</span>
            </button>
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-2 border border-gray-200 rounded-[8px] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">
            <Download size={18} /> Export Data
          </button>
        </div>

        {/* TABEL */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[#94A3B8] border-b border-gray-50 text-[11px] tracking-normal">
                <th className="py-4 px-3 font-normal text-left whitespace-nowrap">NISN</th>
                <th className="py-4 px-3 font-normal text-left whitespace-nowrap">Nama Siswa</th>
                <th className="py-4 px-3 font-normal text-left whitespace-nowrap">Tagihan</th>
                <th className="py-4 px-3 font-normal text-left whitespace-nowrap">Nominal Tagihan</th>
                <th className="py-4 px-3 font-normal text-left whitespace-nowrap">Total Bayar</th>
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
                    <td className="py-4 px-3 text-[12px] font-medium capitalize align-middle">
                      <div className="line-clamp-2 leading-snug w-[140px]">{item.nama_siswa}</div>
                    </td>
                    <td className="py-4 px-3 text-[12px] text-gray-600 whitespace-nowrap">{item.tagihan}</td>
                    <td className="py-4 px-3 text-[12px] whitespace-nowrap text-gray-400 italic">
                      IDR {item.nominal_tagihan?.toLocaleString("id-ID")}
                    </td>
                    <td className="py-4 px-3 text-[12px] font-bold whitespace-nowrap text-[#2D6A4F]">
                      IDR {item.nominal?.toLocaleString("id-ID")}
                    </td>
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-400">
                        Need Approval
                      </span>
                    </td>
                    <td className="py-4 px-3 text-[11px] text-gray-500 whitespace-nowrap">{item.tanggal_pembayaran}</td>
                    <td className="py-4 px-3 text-center whitespace-nowrap overflow-visible">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApprovalClick(item.id, item.type, "Approved")}
                          className="text-green-600 hover:text-green-800 transition-all active:scale-90 cursor-pointer"
                        >
                          <Check size={20} strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => handleApprovalClick(item.id, item.type, "Rejected")}
                          className="text-red-500 hover:text-red-700 transition-all active:scale-90 cursor-pointer"
                        >
                          <X size={20} strokeWidth={3} />
                        </button>

                        <div className="relative">
                          <button
                            id={`btn-aksi-${item.id}`}
                            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 cursor-pointer"
                          >
                            <MoreHorizontal size={20} />
                          </button>

                          {openMenuId === item.id && (
                            <>
                              <div className="fixed inset-0 z-[998]" onClick={() => setOpenMenuId(null)}></div>
                              <div
                                className="fixed z-[999] w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-150"
                                style={{
                                  top: typeof window !== "undefined" ? (document.getElementById(`btn-aksi-${item.id}`)?.getBoundingClientRect().bottom ?? 0) + 8 : 0,
                                  left: typeof window !== "undefined" ? (document.getElementById(`btn-aksi-${item.id}`)?.getBoundingClientRect().left ?? 0) - 160 : 0,
                                }}
                              >
                                <button
                                  onClick={() => handleDelete(item.id)}
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
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-gray-400 font-medium text-sm italic">
                    Data Pembayaran Tidak Ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL KONFIRMASI APPROVAL CUSTOM */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowConfirmModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in duration-200 text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${pendingApproval?.status === "Approved" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                {pendingApproval?.status === "Approved" ? <Check size={32} /> : <X size={32} />}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {pendingApproval?.status === "Approved" ? "Setujui Pembayaran?" : "Tolak Pembayaran?"}
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Tindakan ini akan mengubah status transaksi dan data akan segera diproses. Apakah Anda yakin?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={executeApproval}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold  shadow-lg transition-all active:scale-95 cursor-pointer ${pendingApproval?.status === "Approved" ? "bg-green-600 hover:bg-green-700 shadow-green-200" : "bg-red-600 hover:bg-red-700 shadow-red-200"}`}
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL VIEW BUKTI PEMBAYARAN */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-200 text-left">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preview Bukti Pembayaran</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-all cursor-pointer text-gray-400">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 flex justify-center bg-gray-100/30 min-h-[300px] items-center">
                {selectedBukti ? (
                  <img
                    src={`/uploads/bukti/${selectedBukti}`}
                    alt="Bukti Transfer"
                    className="max-h-[70vh] rounded-lg shadow-md object-contain border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x500?text=Gambar+Tidak+Ditemukan";
                    }}
                  />
                ) : (
                  <div className="py-20 text-gray-400 text-[10px] font-bold uppercase tracking-widest italic text-center w-full">Bukti tidak tersedia</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 bg-white relative z-10">
          <p className="text-[12px] text-gray-400 font-medium">
            {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} items
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-1 text-gray-300 hover:text-[#2D6A4F] disabled:opacity-30 cursor-pointer"><ChevronsLeft size={18} /></button>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="p-1 text-gray-300 hover:text-[#2D6A4F] disabled:opacity-30 cursor-pointer"><ChevronLeft size={18} /></button>
              <div className="flex items-center gap-2 px-2">
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === idx + 1 ? "bg-green-50 text-green-600" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="p-1 text-gray-300 hover:text-[#2D6A4F] disabled:opacity-30 cursor-pointer"><ChevronRight size={18} /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="p-1 text-gray-300 hover:text-[#2D6A4F] disabled:opacity-30 cursor-pointer"><ChevronsRight size={18} /></button>
            </div>
            <div className="text-[12px] text-gray-400 flex items-center gap-2">
              <div className="relative flex items-center">
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none bg-transparent font-bold text-gray-600 pr-5 cursor-pointer focus:outline-none"
                >
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