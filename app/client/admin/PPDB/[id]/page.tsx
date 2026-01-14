"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { displayGender } from "@/lib/gender";
import { 
  ChevronLeft, CheckCircle, Info, Gift, 
  Search, Filter, Download, X, Loader2, Check, AlertCircle,
  FileText, Eye, FolderOpen, MoreHorizontal, Trash2
} from "lucide-react";

export default function DetailCalonSiswaPage() {
  const params = useParams();
  const id = params?.id; 
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("tagihan");

  // State Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // --- STATE VALIDASI & NOTIFIKASI ---
  const [showConfirm, setShowConfirm] = useState(false); // Modal Validasi
  const [showKeringananConfirm, setShowKeringananConfirm] = useState(false); // Modal Keringanan
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Modal Hapus
  
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Untuk loading Keringanan/Hapus
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const fetchData = async () => {
    if (id && id !== "undefined") {
      try {
        setLoading(true);
        const res = await axios.get(`/server/api/admin/PPDB/${id}`);
        setData(res.data);
        setError("");
      } catch (err: any) {
        console.error("Error fetching detail:", err);
        setError(err.response?.data?.error || "Gagal memuat data siswa");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // --- HANDLER VALIDASI ---
  const handleValidation = async () => {
    setIsValidating(true);
    try {
      const res = await axios.post(`/server/api/admin/PPDB/${id}/validasi`, { 
        id_pendaftar: data?.detail?.id_pendaftar 
      });
      
      setNotification({ message: res.data.message, type: 'success' });
      setShowConfirm(false);
      await fetchData(); 
    } catch (err: any) {
      setNotification({ 
        message: err.response?.data?.error || "Terjadi kesalahan sistem", 
        type: 'error' 
      });
    } finally {
      setIsValidating(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // --- HANDLER KERINGANAN ---
  const handleKeringanan = async () => {
    setIsProcessing(true);
    try {
      const res = await axios.patch(`/server/api/admin/PPDB/${id}`, {
        action: "keringanan"
      });
      setNotification({ message: res.data.message, type: 'success' });
      setShowKeringananConfirm(false);
      await fetchData();
    } catch (err: any) {
      setNotification({
        message: err.response?.data?.error || "Gagal memberi keringanan",
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // --- HANDLER HAPUS ---
  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      const res = await axios.delete(`/server/api/admin/PPDB/${id}`);
      setNotification({ message: res.data.message, type: 'success' });
      setShowDeleteConfirm(false);
      // Redirect setelah hapus berhasil
      setTimeout(() => {
        router.push('/client/admin/PPDB'); // Sesuaikan route list siswa Anda
      }, 1500);
    } catch (err: any) {
      setNotification({
        message: err.response?.data?.error || "Gagal menghapus siswa",
        type: 'error'
      });
      setIsProcessing(false); // Stop loading only on error
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (loading) return <div className="ml-64 p-10 text-gray-400 font-medium text-center">Memuat Detail...</div>;
  if (error) return <div className="ml-64 p-10 text-red-500 text-center">{error}</div>;

  const s = data?.detail;
  const isDaftarUlang = data?.status_tahap === "Daftar Ulang";
  
  // Logic Kelayakan Validasi
  const isLunasPendaftaran = s?.tb_pembayaran_pendaftaran?.some((p: any) => p.status === 'lunas');
  const hasDaftarUlangPayment = s?.tb_daftar_ulang?.[0]?.tb_pembayaran_daftar_ulang?.length > 0;
  const canValidate = isDaftarUlang ? hasDaftarUlangPayment : isLunasPendaftaran;

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  };

  // --- LOGIC TAGIHAN (Sama seperti sebelumnya) ---
  const masterTagihan = data?.jenis_pembayaran || []; 
  const riwayatDaftarUlang = s?.tb_daftar_ulang?.[0]?.tb_pembayaran_daftar_ulang || [];
  const riwayatPendaftaran = s?.tb_pembayaran_pendaftaran || [];
  const semuaRiwayatBayar = [...riwayatDaftarUlang, ...riwayatPendaftaran];

  const daftarTagihanFinal = masterTagihan.map((jenis: any) => {
    const transaksiTerkait = semuaRiwayatBayar.filter((p: any) => {
      if (p.id_jenis_pembayaran) {
        return Number(p.id_jenis_pembayaran) === Number(jenis.id_jenis_pembayaran);
      }
      return Number(jenis.id_jenis_pembayaran) === 1;
    });
    
    const totalTerbayar = transaksiTerkait
      .filter((p: any) => p.status === "lunas" || p.status === "cicil")
      .reduce((acc: number, curr: any) => acc + (Number(curr.nominal) || 0), 0);
      
    const adaPending = transaksiTerkait.some((p: any) => p.status === "menunggu");
    
    const updateTerakhir = transaksiTerkait.length > 0 
      ? transaksiTerkait.sort((a:any, b:any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at 
      : s?.updated_at;
      
    const nominalTagihan = Number(jenis.nominal) || 0;
    const sisa = Math.max(0, nominalTagihan - totalTerbayar);
    
    return {
      id_jenis: jenis.id_jenis_pembayaran,
      nama: jenis.nama_pembayaran,
      total: nominalTagihan,
      terbayar: totalTerbayar,
      sisa: sisa,
      lunas: totalTerbayar >= nominalTagihan && nominalTagihan > 0,
      isPending: adaPending,
      updateTerbaru: updateTerakhir
    };
  });

  const filteredTagihan = daftarTagihanFinal.filter((t: any) => {
    const matchSearch = t.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterStatus === "all" ? true : filterStatus === "lunas" ? t.lunas : !t.lunas;
    return matchSearch && matchFilter;
  });

  const grandTotalTagihan = daftarTagihanFinal.reduce((acc: number, curr: any) => acc + curr.total, 0);
  const grandTotalTerbayar = daftarTagihanFinal.reduce((acc: number, curr: any) => acc + curr.terbayar, 0);
  const grandSisaTagihan = grandTotalTagihan - grandTotalTerbayar;
  const statusLunasGlobal = grandTotalTagihan > 0 && grandSisaTagihan === 0;

  const prestasiList = s?.tb_prestasi_pendaftar || [];

  return (
    <div className="ml-64 bg-gray-100 min-h-screen pb-10 px-5 pt-5 antialiased font-sans relative">
      
      {/* NOTIFIKASI TOAST */}
      {notification && (
        <div className="fixed top-24 right-9 z-[10001] flex justify-center pointer-events-none animate-in fade-in slide-in-from-right duration-500">
          <div className={`flex items-center gap-3 px-4 py-4 rounded-xl shadow-2xl border bg-white pointer-events-auto ${notification.type === 'success' ? 'border-green-100' : 'border-red-100'}`}>
            <div className={notification.type === 'success' ? 'text-green-600' : 'text-red-600'}>
              {notification.type === 'success' ? <Check size={16} strokeWidth={4} /> : <X size={16} strokeWidth={4} />}
            </div>
            <p className="text-[12px] font-bold text-gray-700 whitespace-nowrap tracking-tight">{notification.message}</p>
            <div className="w-[1px] h-3 bg-gray-200 ml-1"></div>
            <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col mb-5">
        <p className="text-[10px] text-gray-400 mb-2 tracking-widest">PPDB / <span className="text-green-600">Detail Calon Siswa</span></p>
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-800 hover:opacity-70 transition-all cursor-pointer">
            <ChevronLeft size={20} className="text-gray-700" />
            <h2 className="text-xl font-bold tracking-tight">Detail Calon Siswa</h2>
          </button>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowConfirm(true)}
              className="px-5 py-2.5 bg-[#5BA47E] text-white rounded-[8px] text-sm font-semibold flex items-center gap-2 shadow-sm transition-all hover:bg-[#4a8a68] cursor-pointer"
            >
              <CheckCircle size={18} /> {isDaftarUlang ? "Validasi Siswa" : "Validasi Daftar Ulang"}
            </button>
            <button 
              onClick={() => setShowKeringananConfirm(true)}
              className="px-5 py-2.5 bg-white border border-gray-200 text-green-600 rounded-[8px] text-sm font-semibold flex items-center gap-2 transition-all hover:bg-green-50 cursor-pointer"
            >
              <Gift size={18} /> Beri Keringanan
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-[8px] text-sm font-semibold flex items-center gap-2 transition-all hover:bg-red-50 cursor-pointer"
            >
              <Trash2 size={18} /> Hapus
            </button>
          </div>
        </div>
      </div>

      {/* MODAL KONFIRMASI VALIDASI */}
      {showConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowConfirm(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${canValidate ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {canValidate ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
            </div>
            <h3 className="text-lg font-bold mb-2">{canValidate ? 'Konfirmasi Validasi' : 'Validasi Gagal'}</h3>
            {!canValidate ? (
               <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-6">
                 <p className="text-[11px] text-red-600 font-semibold leading-relaxed">
                   {isDaftarUlang ? "Siswa belum membayar Daftar Ulang." : "Siswa belum melunasi Pendaftaran."}
                 </p>
               </div>
            ) : (
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Apakah Anda yakin ingin memvalidasi <b>{s?.nama_lengkap}</b>?
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">Batal</button>
              {canValidate && (
                <button onClick={handleValidation} disabled={isValidating} className="flex-1 py-2.5 rounded-xl bg-[#068A50] text-white text-sm font-semibold shadow-lg active:scale-95 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50">
                  {isValidating ? <Loader2 className="animate-spin" size={16}/> : "Ya, Lanjutkan"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI KERINGANAN */}
      {showKeringananConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowKeringananConfirm(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-yellow-100 text-yellow-600">
              <Gift size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2">Beri Keringanan?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin memberikan keringanan? <br/> Status siswa akan berubah menjadi <span className="font-bold text-gray-800">Bantuan</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowKeringananConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">Batal</button>
              <button onClick={handleKeringanan} disabled={isProcessing} className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-white text-sm font-semibold shadow-lg active:scale-95 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50">
                {isProcessing ? <Loader2 className="animate-spin" size={16}/> : "Ya, Beri Keringanan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100 text-red-600">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2">Hapus Siswa?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus data <b>{s?.nama_lengkap}</b>? <br/>
              <span className="text-red-500 text-xs font-bold">Tindakan ini tidak dapat dibatalkan.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">Batal</button>
              <button onClick={handleDelete} disabled={isProcessing} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold shadow-lg active:scale-95 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50">
                {isProcessing ? <Loader2 className="animate-spin" size={16}/> : "Ya, Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 bg-white p-8 rounded-[12px] shadow-sm border border-gray-100">
          <div className="mb-8 text-left">
             <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{s?.nama_lengkap}</h3>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400 tracking-widest">{s?.email || "siswa@persis.com"}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${isDaftarUlang ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>{data?.status_tahap}</span>
                {s?.tipe_siswa === 'bantuan' && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-blue-50 text-blue-600">Bantuan</span>
                )}
             </div>
          </div>
          <div className="grid grid-cols-4 gap-y-8 gap-x-4">
            <InfoItem label="Tempat Tanggal Lahir" value={`${s?.tempat_lahir}, ${s?.tanggal_lahir?.split('T')[0]}`} />
            <InfoItem label="Jenis Kelamin" value={displayGender(s?.jenis_kelamin)} />
            <InfoItem label="Anak ke" value={s?.anak_ke} />
            <InfoItem label="Jumlah Saudara" value={s?.jumlah_saudara} />
            
            {/* === LOGIC MENAMPILKAN HAFALAN KHUSUS TAHFIDZ === */}
            <InfoItem 
              label="Jalur Pendaftaran" 
              value={
                <div className="flex items-center gap-2">
                  <span className="capitalize">{s?.jalur_pendaftaran}</span>
                  {s?.jalur_pendaftaran?.toLowerCase() === "tahfidz" && s?.jumlah_hafalan && (
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold">
                       {s.jumlah_hafalan}
                    </span>
                  )}
                </div>
              } 
            />
            {/* ================================================ */}

            <InfoItem label="No Hp" value={s?.no_hp} />
            <InfoItem label="Ukuran Baju" value={s?.ukuran_baju} />
            <InfoItem label="Alamat" value={s?.alamat_rumah} />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[12px] shadow-sm border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight text-left">NISN</h3>
          <p className="text-[13px] font-bold text-gray-300 mb-10 text-left">{s?.nisn}</p>
          <div className="grid grid-cols-2 gap-y-8">
            <InfoItem label="Status Siswa" value={<span className="text-green-600 font-bold capitalize">{s?.tipe_siswa}</span>} />
            <InfoItem label="Asal Sekolah" value={s?.asal_sekolah} />
            <InfoItem label="Tahun Lulus" value={s?.tahun_lulus} />
            <InfoItem label="Alamat Sekolah" value={<span className="capitalize truncate block max-w-full">{s?.alamat_sekolah}</span>} />
          </div>
        </div>
      </div>

      {/* Parent Data */}
      <div className="bg-white p-8 rounded-[12px] shadow-sm border border-gray-100 mb-5">
        <h3 className="text-[15px] font-bold text-gray-900 mb-8 tracking-tight uppercase tracking-widest text-left">Data Orang Tua</h3>
        <div className="grid grid-cols-5 gap-y-10 gap-x-4">
          <InfoItem label="Nama Ayah" value={s?.nama_ayah} />
          <InfoItem label="Lahir Ayah" value={`${s?.tempat_lahir_ayah || '-'}, ${s?.tanggal_lahir_ayah?.split('T')[0] || '-'}`} />
          <InfoItem label="Pendidikan" value={s?.pendidikan_ayah} />
          <InfoItem label="Pekerjaan" value={s?.pekerjaan_ayah} />
          <InfoItem label="Penghasilan" value={s?.penghasilan_ayah} />
          <InfoItem label="Nama Ibu" value={s?.nama_ibu} />
          <InfoItem label="Lahir Ibu" value={`${s?.tempat_lahir_ibu || '-'}, ${s?.tanggal_lahir_ibu?.split('T')[0] || '-'}`} />
          <InfoItem label="Pendidikan" value={s?.pendidikan_ibu} />
          <InfoItem label="Pekerjaan" value={s?.pekerjaan_ibu} />
          <InfoItem label="Penghasilan" value={s?.penghasilan_ibu} />
          <InfoItem label="No Hp Ortu" value={s?.no_hp_orang_tua} />
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 px-2">
          <TabButton active={activeTab === "tagihan"} onClick={() => setActiveTab("tagihan")} label="Daftar Tagihan" />
          <TabButton active={activeTab === "dokumen"} onClick={() => setActiveTab("dokumen")} label="Dokumen" />
          <TabButton active={activeTab === "prestasi"} onClick={() => setActiveTab("prestasi")} label="Prestasi" />
        </div>
        
        {/* ================= TAB TAGIHAN ================= */}
        {activeTab === "tagihan" && (
          <div className="p-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-4 gap-5 mb-8">
              <SummaryCard label="Total Tagihan" value={formatIDR(grandTotalTagihan)} />
              <SummaryCard label="Total Terbayar" value={formatIDR(grandTotalTerbayar)} className="text-green-600" />
              <SummaryCard label="Sisa Tagihan" value={formatIDR(grandSisaTagihan)} className="text-red-600" />
              <div className={`p-5 rounded-[12px] border flex flex-col gap-1 text-left ${statusLunasGlobal ? "border-green-100 bg-green-50/30" : "border-red-100 bg-red-50/30"}`}>
                 <p className={`text-[10px] font-bold uppercase tracking-widest ${statusLunasGlobal ? "text-green-400" : "text-red-400"}`}>Status Pembayaran</p>
                 <p className={`text-[17px] font-bold ${statusLunasGlobal ? "text-green-600" : "text-red-600"}`}>{statusLunasGlobal ? "Lunas" : "Belum Lunas"}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-3 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input type="text" placeholder="Cari....." className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-sm outline-none w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-gray-400 text-sm hover:bg-gray-50"><Filter size={18} /> Filter</button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-[8px] text-gray-400 text-sm hover:bg-gray-50"><Download size={18} /> Export Data</button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-gray-400 font-bold tracking-widest border-b border-gray-50">
                  <th className="py-5 px-4">Nama Tagihan</th>
                  <th className="py-5 px-4">Total Tagihan</th>
                  <th className="py-5 px-4">Total Terbayar</th>
                  <th className="py-5 px-4 text-center">Sisa Tagihan</th>
                  <th className="py-5 px-4 text-center">Status</th>
                  <th className="py-5 px-4 text-center">Update Terbaru</th>
                  <th className="py-5 px-4 text-center">Riwayat</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-[#3b3b3b]">
                {filteredTagihan.map((tagihan: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-5 px-4 font-medium text-gray-700">{tagihan.nama}</td>
                    <td className="py-5 px-4 font-medium text-gray-400">{formatIDR(tagihan.total)}</td>
                    <td className="py-5 px-4 text-green-600 font-bold">{formatIDR(tagihan.terbayar)}</td>
                    <td className="py-5 px-4 text-red-600 text-center font-bold">{formatIDR(tagihan.sisa)}</td>
                    <td className="py-5 px-4 text-center">
                      {tagihan.isPending ? <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase bg-yellow-50 text-yellow-600 whitespace-nowrap">Menunggu Verifikasi</span> : <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase whitespace-nowrap ${tagihan.lunas ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{tagihan.lunas ? 'Lunas' : 'Belum Lunas'}</span>}
                    </td>
                    <td className="py-5 px-4 text-center text-gray-400 font-medium">{tagihan.updateTerbaru ? new Date(tagihan.updateTerbaru).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-"}</td>
                    <td className="py-5 px-4 text-center"><button onClick={() => router.push(`/client/admin/PPDB/riwayat-pembayaran/${s?.id_pendaftar}?tagihan=${tagihan.id_jenis}`)} className="p-2 hover:bg-green-50 rounded-full text-green-600 cursor-pointer"><Info size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* ================= TAB DOKUMEN ================= */}
        {activeTab === "dokumen" && (
          <div className="p-8 animate-in fade-in duration-300 min-h-[400px] flex flex-col justify-center">
             {s?.tb_dokumen && s.tb_dokumen.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full self-start">
                {s.tb_dokumen.map((doc: any, i: number) => (
                    <div key={i} className="border border-gray-100 p-5 rounded-xl flex items-start gap-4 hover:shadow-md transition-all bg-gray-50/30">
                    <div className="bg-green-100 p-3 rounded-lg text-green-700">
                        <FileText size={24} />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-[12px] font-bold text-gray-800 uppercase tracking-wide mb-1 line-clamp-1">
                            {doc.jenis_dokumen?.replace(/_/g, " ") || "Dokumen"}
                        </p>
                        <p className="text-[10px] text-gray-400 mb-3">
                            Diupload: {new Date(doc.uploaded_at).toLocaleDateString('id-ID')}
                        </p>
                        <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[#068A50] hover:underline flex items-center gap-1 cursor-pointer">
                            Lihat File <Eye size={12} />
                        </a>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <EmptyState message="Dokumen tidak tersedia" subMessage="Calon Siswa belum mengupload dokumen apapun" type="grid" />
            )}
          </div>
        )}

        {/* ================= TAB PRESTASI ================= */}
        {activeTab === "prestasi" && (
          <div className="animate-in fade-in duration-300 min-h-[400px]">
             {prestasiList.length > 0 ? (
               <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                    <tr className="text-[10px] text-gray-400 font-bold border-b border-gray-50 tracking-widest">
                      <th className="px-8 py-5">Nama Prestasi</th>
                      <th className="px-8 py-5">Jenis</th>
                      <th className="px-8 py-5">Tingkat</th>
                      <th className="px-8 py-5">Peringkat</th>
                      <th className="px-8 py-5">Tahun</th>
                      <th className="px-8 py-5">Penyelenggara</th>
                      <th className="px-8 py-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-[#3b3b3b]">
                      {prestasiList.map((p: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50/30 text-[11px] transition-all">
                              <td className="px-8 py-5 font-bold text-gray-700">{p.nama_prestasi}</td>
                              <td className="px-8 py-5 font-medium text-gray-500 capitalize">{p.jenis_prestasi?.replace(/_/g, ' ')}</td>
                              <td className="px-8 py-5">
                                  <span className="text-[#068A50] font-bold bg-green-50 rounded-lg px-3 py-1 text-[10px] capitalize">
                                      {p.tingkat}
                                  </span>
                              </td>
                              <td className="px-8 py-5 font-bold">{p.peringkat}</td>
                              <td className="px-8 py-5 text-gray-400 font-bold">{p.tahun}</td>
                              <td className="px-8 py-5 text-gray-600 font-medium">{p.penyelenggara}</td>
                              <td className="px-8 py-5 text-center">
                                  <button className="text-gray-300 hover:text-[#068A50] transition-colors cursor-pointer">
                                      <MoreHorizontal size={18} />
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
               </table>
             ) : (
               <EmptyState message="Data Prestasi tidak tersedia" subMessage="Calon Siswa belum memiliki riwayat prestasi" />
             )}
          </div>
        )}

      </div>
      <footer className="mt-10 text-[11px] text-gray-300 font-semibold text-center tracking-widest uppercase">© MA PERSIS KUDANG</footer>
    </div>
  );
}

// --- SUB COMPONENTS ---
function InfoItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex flex-col gap-1 text-left">
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{label}</span>
      <div className="text-[12px] font-semibold text-gray-700 leading-tight">{value || "-"}</div>
    </div>
  );
}

function TabButton({ active, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`px-8 py-5 text-[12px] font-bold transition-all border-b-2 cursor-pointer ${active ? 'border-[#068A50] text-[#068A50]' : 'border-transparent text-gray-400'}`}>{label}</button>
  );
}

function SummaryCard({ label, value, className = "" }: any) {
  return (
    <div className="p-5 rounded-[12px] border border-gray-100 bg-white shadow-sm flex flex-col gap-1 text-left">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className={`text-[17px] font-bold tracking-tight ${className || "text-gray-800"}`}>{value}</p>
    </div>
  );
}

function EmptyState({ message, subMessage, type = 'table' }: { message: string, subMessage?: string, type?: 'table' | 'grid' }) {
    const content = (
        <div className="flex flex-col items-center justify-center gap-3 w-full">
            <div className="bg-gray-50 p-4 rounded-full">
               <FolderOpen size={40} className="text-gray-300" />
            </div>
            <div>
                <p className="text-gray-600 text-sm font-bold">{message}</p>
                {subMessage && <p className="text-gray-400 text-xs mt-1">{subMessage}</p>}
            </div>
        </div>
    );

    if (type === 'grid') {
        return (
            <div className="w-full py-20 flex justify-center col-span-1 md:col-span-3">
                {content}
            </div>
        );
    }

    return (
        <table className="w-full h-full">
            <tbody>
                <tr className="w-full">
                    <td colSpan={7} className="py-20 text-center w-full">
                        {content}
                    </td>
                </tr>
            </tbody>
        </table>
    );
}