"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Search, Plus, Download, MoreHorizontal, 
  X, Edit2, Trash2, Check, AlertCircle, Loader2 
} from "lucide-react";
import * as XLSX from "xlsx";

// Tipe Data
interface Tagihan {
  id_jenis_pembayaran: number;
  nama_pembayaran: string;
  nominal: number;
  status: string; // 'aktif' | 'nonaktif'
  updated_at?: string; 
}

export default function PengaturanTagihanPage() {
  const [data, setData] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  // State Modals
  const [showModalForm, setShowModalForm] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // State Notification (Toast)
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // State Form
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    nama: "",
    value: "",
    status: true // Default ON
  });

  // --- HELPER: Show Notification ---
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    // Hilang otomatis setelah 3 detik
    setTimeout(() => setNotification(null), 4000);
  };

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      // setLoading(true); // Opsional: matikan loading biar interaksi lebih smooth saat refresh
      const res = await axios.get("/server/api/admin/tambahDataTagihan");
      
      const normalizedData = res.data.map((item: any) => ({
        ...item,
        status: item.status || "aktif" 
      }));
      
      setData(normalizedData);
    } catch (error) {
      console.error(error);
      showNotification("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLERS ---
  
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({ id: 0, nama: "", value: "", status: true });
    setShowModalForm(true);
    setMenuOpenId(null);
  };

  const handleOpenEdit = (item: Tagihan) => {
    setIsEditMode(true);
    setFormData({
      id: item.id_jenis_pembayaran,
      nama: item.nama_pembayaran,
      value: item.nominal.toString(),
      status: item.status === "aktif"
    });
    setShowModalForm(true);
    setMenuOpenId(null);
  };

  const handlePreSave = () => {
    if(!formData.nama || !formData.value) {
        showNotification("Mohon lengkapi Nama dan Nominal tagihan", "error");
        return;
    }
    setShowModalForm(false);
    setShowConfirmSave(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        nama_pembayaran: formData.nama,
        nominal: parseInt(formData.value),
        status: formData.status ? "aktif" : "non_aktif" 
      };

      if (isEditMode) {
        await axios.put(`/server/api/admin/tambahDataTagihan/${formData.id}`, payload);
        showNotification("Data berhasil diperbarui!", "success");
      } else {
        await axios.post("/server/api/admin/tambahDataTagihan", payload);
        showNotification("Data berhasil ditambahkan!", "success");
      }

      setShowConfirmSave(false);
      fetchData(); 
    } catch (error) {
      console.error(error);
      setShowConfirmSave(false);
      showNotification("Gagal menyimpan data.", "error");
    }
  };

  const handleOpenDelete = (item: Tagihan) => {
    setFormData({ ...formData, id: item.id_jenis_pembayaran });
    setMenuOpenId(null);
    setShowConfirmDelete(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/server/api/admin/tambahDataTagihan/${formData.id}`);
      
      setShowConfirmDelete(false);
      fetchData();
      showNotification("Data berhasil dihapus!", "success");

    } catch (error: any) {
      console.error(error);
      setShowConfirmDelete(false);
      
      // Ambil pesan error spesifik dari backend (soal Foreign Key)
      const errorMsg = error.response?.data?.error || "Gagal menghapus data";
      showNotification(errorMsg, "error");
    }
  };

  const handleToggleStatus = async (item: Tagihan) => {
    const newStatusString = item.status === "aktif" ? "non_aktif" : "aktif";
    
    // Optimistic Update
    const updatedData = data.map(d => 
      d.id_jenis_pembayaran === item.id_jenis_pembayaran ? {...d, status: newStatusString} : d
    );
    setData(updatedData);

    try {
      await axios.put(`/server/api/admin/tambahDataTagihan/${item.id_jenis_pembayaran}`, {
        status: newStatusString
      });
      // Tidak perlu notif sukses untuk toggle biar gak berisik, visual switch sudah cukup
    } catch (error) {
      console.error("Gagal update status", error);
      fetchData(); // Revert
      showNotification("Gagal mengubah status.", "error");
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tagihan");
    XLSX.writeFile(wb, "Data_Tagihan.xlsx");
  };

  const filteredData = data.filter(item => 
    item.nama_pembayaran.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ml-64 p-6 bg-gray-100 min-h-screen font-sans text-[#333] relative">
      
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
                <button onClick={() => setNotification(null)} className="ml-4 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span onClick={() => window.history.back()} className="cursor-pointer hover:bg-gray-200 p-1 rounded">←</span> 
            Detail Tagihan
          </h1>
          <button 
            onClick={handleOpenAdd}
            className="bg-[#068A50] hover:bg-[#1f4e3a] text-white px-5 py-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> Tambah Data
          </button>
        </div>
      </div>

      {/* Info Atas */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold mb-4">Tagihan</h2>
        <div className="flex justify-between max-w-md">
          <div>
            <p className="text-xs text-gray-400 mb-1">Jumlah Data</p>
            <p className="text-xl font-bold text-gray-800">{data.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Type</p>
            <p className="text-md font-medium text-gray-600">Varchar / Int</p>
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible min-h-[500px]">
        
        {/* Toolbar */}
        <div className="p-5 flex justify-between items-center border-b border-gray-50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari....." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#2D6A4F] transition-all"
            />
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
          >
            <Download size={16} /> Export Data
          </button>
        </div>

        {/* Tabel Data */}
        <table className="w-full text-left">
          <thead className="bg-gray-50/50">
            <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-gray-100">
              <th className="px-6 py-4">Nama Data</th>
              <th className="px-6 py-4">Value</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4">Update Terbaru</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-[12px] text-gray-600 divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-20 text-gray-400 font-medium"><Loader2 className="animate-spin inline mr-2"/> Memuat data...</td></tr>
            ) : filteredData.length === 0 ? (
               <tr><td colSpan={5} className="text-center py-20 text-gray-400 font-medium">Data tidak ditemukan</td></tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id_jenis_pembayaran} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{item.nama_pembayaran}</td>
                  <td className="px-6 py-4">IDR {item.nominal.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-center">
                    {/* Toggle Switch */}
                    <button 
                      onClick={() => handleToggleStatus(item)}
                      className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 flex items-center mx-auto cursor-pointer ${item.status === "aktif" ? 'bg-[#2D6A4F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${item.status === "aktif" ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {item.updated_at 
                      ? new Date(item.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : "-"
                    }
                  </td>
                  <td className="px-6 py-4 text-center relative">
                    <button 
                      onClick={() => setMenuOpenId(menuOpenId === item.id_jenis_pembayaran ? null : item.id_jenis_pembayaran)}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-[#2D6A4F] transition-all cursor-pointer"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {menuOpenId === item.id_jenis_pembayaran && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)}></div>
                        <div className="absolute right-8 top-8 z-20 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 text-left animate-in fade-in zoom-in duration-100">
                          <button 
                            onClick={() => handleOpenEdit(item)}
                            className="w-full px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-yellow-600 flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button 
                            onClick={() => handleOpenDelete(item)}
                            className="w-full px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 size={12} /> Hapus
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModalForm(false)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">{isEditMode ? "Edit Data" : "Tambah Data"}</h3>
              <button onClick={() => setShowModalForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nama Data</label>
                <input type="text" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#2D6A4F] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Value (Nominal)</label>
                <input type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#2D6A4F] transition-all" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-gray-500">Status</span>
                <button 
                  onClick={() => setFormData({...formData, status: !formData.status})}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${formData.status ? 'bg-[#2D6A4F]' : 'bg-gray-300'}`}
                >
                   <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${formData.status ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            <button onClick={handlePreSave} className="w-full mt-8 bg-[#2D6A4F] hover:bg-[#1f4e3a] text-white py-3 rounded-lg text-sm font-bold shadow-lg active:scale-95 transition-all cursor-pointer">
              {isEditMode ? "Simpan Perubahan" : "Tambah"}
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Simpan */}
      {showConfirmSave && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
           <div className="relative bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl text-center animate-in zoom-in duration-200">
              <div className="w-20 h-20 bg-[#FCD34D] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white ring-4 ring-yellow-50">
                 <span className="text-white text-4xl font-bold">?</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Konfirmasi</h3>
              <p className="text-xs text-gray-500 mb-8 leading-relaxed px-4">Apakah data yang Anda masukkan sudah benar?</p>
              <div className="flex gap-3">
                 <button onClick={() => { setShowConfirmSave(false); setShowModalForm(true); }} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer">Batalkan</button>
                 <button onClick={handleSave} className="flex-1 py-2.5 bg-[#FBBF24] hover:bg-[#F59E0B] text-white rounded-lg text-xs font-bold shadow-md cursor-pointer">Ya, Simpan</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirmDelete(false)}></div>
           <div className="relative bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl text-center animate-in zoom-in duration-200">
              <div className="w-20 h-20 bg-[#9B1C1C] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white ring-4 ring-red-50">
                 <span className="text-white text-4xl font-bold">!</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus Data</h3>
              <p className="text-xs text-gray-500 mb-8 leading-relaxed px-4">Apakah Anda yakin? Tindakan ini permanen.</p>
              <div className="flex gap-3">
                 <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer">Batalkan</button>
                 <button onClick={handleDelete} className="flex-1 py-2.5 bg-[#9B1C1C] hover:bg-[#7f1616] text-white rounded-lg text-xs font-bold shadow-md cursor-pointer">Ya, Hapus</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}