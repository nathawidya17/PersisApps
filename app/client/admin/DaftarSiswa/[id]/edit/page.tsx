"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  ChevronLeft, ChevronRight, Check, X, 
  AlertCircle, Loader2, Save 
} from "lucide-react";

export default function EditDetailSiswa() {
  const { id } = useParams();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});

  // --- STATE MODAL & NOTIFIKASI ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    axios.get(`/server/api/admin/DaftarSiswa/${id}`)
      .then(res => {
        const s = res.data.detailSiswa;
        const o = s.tb_orang_tua?.[0] || {};
        setFormData({
          ...s,
          ...o,
          tanggal_lahir: s.tanggal_lahir?.split('T')[0],
          tanggal_lahir_ayah: o.tanggal_lahir_ayah?.split('T')[0],
          tanggal_lahir_ibu: o.tanggal_lahir_ibu?.split('T')[0],
          // Pastikan field ini ada meski null di db
          jumlah_hafalan: s.jumlah_hafalan || "",
          jalur_pendaftaran: s.jalur_pendaftaran || "-" 
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. Trigger Modal Konfirmasi
  const handlePreSubmit = () => {
    setShowConfirmModal(true);
  };

  // 2. Eksekusi Simpan ke API
  const executeSubmit = async () => {
    setIsSaving(true);
    try {
      await axios.put(`/server/api/admin/DaftarSiswa/${id}`, formData);
      
      setShowConfirmModal(false);
      setNotification({ message: "Data siswa berhasil diperbarui!", type: 'success' });

      // Redirect setelah sukses (delay sedikit biar notif terbaca)
      setTimeout(() => {
        router.push(`/client/admin/DaftarSiswa/${id}`);
      }, 1500);

    } catch (error) {
      console.error("Gagal update data", error);
      setShowConfirmModal(false);
      setNotification({ message: "Gagal memperbarui data. Coba lagi.", type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="ml-64 p-10 text-gray-400">Loading Form...</div>;

  // Helper untuk cek apakah Tahfidz (Case insensitive)
  const isTahfidz = formData.jalur_pendaftaran?.toLowerCase() === "tahfidz";

  return (
    <div className="ml-64 bg-gray-100 min-h-screen pb-10 px-5 pt-5 antialiased font-sans relative">
      
      {/* --- NOTIFIKASI TOAST --- */}
      {notification && (
        <div className="fixed top-24 right-10 z-[9999] animate-in fade-in slide-in-from-right duration-300">
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

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] text-[#9E9E9E] mb-5 font-medium uppercase tracking-wider">
        <span>Daftar Siswa</span> <span>/</span> <span>Detail Siswa</span> <span>/</span> <span className="text-[#068A50]">Edit Detail</span>
      </nav>

      {/* Header Title */}
      <div className="flex items-center gap-3 mb-5 cursor-pointer group w-fit" onClick={() => router.back()}>
        <div className="p-1 hover:bg-gray-200 rounded-full transition-colors">
          <ChevronLeft size={20} className="text-[#2D2D2D]" />
        </div>
        <h2 className="text-xl font-bold text-[#2D2D2D]">Edit Detail Siswa</h2>
      </div>

      <div className="bg-white rounded-[12px] shadow-sm border border-[#EEEEEE] overflow-hidden">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-gray-50">
          <StepCircle num={1} label="Data Siswa" active={step >= 1} current={step === 1} />
          <div className={`flex-grow h-[2px] mx-4 transition-colors ${step > 1 ? 'bg-[#428E5F]' : 'bg-gray-100'}`}></div>
          <StepCircle num={2} label="Sekolah Asal" active={step >= 2} current={step === 2} />
          <div className={`flex-grow h-[2px] mx-4 transition-colors ${step > 2 ? 'bg-[#428E5F]' : 'bg-gray-100'}`}></div>
          <StepCircle num={3} label="Orang Tua" active={step >= 3} current={step === 3} />
        </div>

        {/* Form Body */}
        <div className="p-8">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-5">
              <FormInput label="Nama Siswa" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Masukkan nama lengkap" />
              <FormSelect label="Jenis Kelamin" name="jenis_kelamin" value={formData.jenis_kelamin} options={["Laki-laki", "Perempuan"]} onChange={handleChange} />
              
              {/* JALUR PENDAFTARAN (READ ONLY / DISABLED) */}
              <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
                 <label className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Jalur Pendaftaran</label>
                 <input 
                    disabled 
                    value={formData.jalur_pendaftaran}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-[8px] text-[13px] text-gray-500 cursor-not-allowed capitalize font-medium"
                 />
              </div>

              {/* LOGIC FIELD HAFALAN (Hanya muncul jika Tahfidz) */}
              {isTahfidz && (
                 <div className="col-span-1">
                    <FormInput 
                        label="Jumlah Hafalan (Juz)" 
                        name="jumlah_hafalan" 
                        value={formData.jumlah_hafalan} 
                        onChange={handleChange} 
                        placeholder="Contoh: 5 Juz" 
                    />
                 </div>
              )}

              <FormInput label="Anak Ke" name="anak_ke" value={formData.anak_ke} onChange={handleChange} placeholder="Contoh: 1" />
              <FormInput label="Jumlah Saudara" name="jumlah_saudara" value={formData.jumlah_saudara} onChange={handleChange} placeholder="Contoh: 2" />
              <FormInput label="NIK" name="nik" value={formData.nik} onChange={handleChange} placeholder="16 digit NIK" />
              <FormInput label="No KK" name="no_kk" value={formData.no_kk} onChange={handleChange} placeholder="16 digit No KK" />
              <FormInput label="No Handphone" name="no_hp" value={formData.no_hp} onChange={handleChange} placeholder="+62 ..." />
              <FormInput label="Email" name="email" value={formData.email} onChange={handleChange} placeholder="email@contoh.com" />
              <div className="col-span-2">
                <FormInput label="Alamat Lengkap" name="alamat" value={formData.alamat} onChange={handleChange} placeholder="Jl. Raya No..." />
              </div>
              <div className="grid grid-cols-3 col-span-2 gap-5">
                <FormInput label="RT" name="rt" value={formData.rt} onChange={handleChange} placeholder="00" />
                <FormInput label="RW" name="rw" value={formData.rw} onChange={handleChange} placeholder="00" />
                <FormInput label="Kode Pos" name="kode_pos" value={formData.kode_pos} onChange={handleChange} placeholder="00000" />
              </div>
              <FormSelect label="Ukuran Baju Olahraga" name="ukuran_baju" value={formData.ukuran_baju} options={["S", "M", "L", "XL", "XXL"]} onChange={handleChange} />
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-5">
              <FormInput label="Asal Sekolah" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleChange} placeholder="Nama sekolah" />
              <FormInput label="Tahun Lulus" name="tahun_lulus" value={formData.tahun_lulus} onChange={handleChange} placeholder="Contoh: 2024" />
              <div className="col-span-2">
                <FormInput label="Alamat Sekolah" name="alamat_sekolah" value={formData.alamat_sekolah} onChange={handleChange} placeholder="Alamat lengkap sekolah" />
              </div>
              <FormInput label="NISN" name="NISN" value={formData.NISN} onChange={handleChange} placeholder="10 digit NISN" />
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-5">
              <h4 className="col-span-2 font-bold text-[#9E9E9E] text-[10px] uppercase tracking-widest border-b pb-2">Data Ayah</h4>
              <FormInput label="Nama Ayah" name="nama_ayah" value={formData.nama_ayah} onChange={handleChange} placeholder="Nama lengkap ayah" />
              <FormInput label="Pekerjaan Ayah" name="pekerjaan_ayah" value={formData.pekerjaan_ayah} onChange={handleChange} placeholder="Pekerjaan ayah" />
              
              <h4 className="col-span-2 font-bold text-[#9E9E9E] text-[10px] uppercase tracking-widest border-b pb-2 mt-4">Data Ibu</h4>
              <FormInput label="Nama Ibu" name="nama_ibu" value={formData.nama_ibu} onChange={handleChange} placeholder="Nama lengkap ibu" />
              <FormInput label="Pekerjaan Ibu" name="pekerjaan_ibu" value={formData.pekerjaan_ibu} onChange={handleChange} placeholder="Pekerjaan ibu" />
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-6 py-2.5 text-gray-500 font-bold text-sm hover:text-gray-800 transition-colors"
            >
              Kembali
            </button>
          )}
          {step < 3 ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-8 py-2.5 bg-[#428E5F] text-white rounded-[8px] font-bold text-sm shadow-sm hover:bg-[#36754e] transition-all"
            >
              Lanjutkan <ChevronRight size={16} />
            </button>
          ) : (
            // Ganti onClick menjadi handlePreSubmit untuk memunculkan modal
            <button 
              onClick={handlePreSubmit}
              className="flex items-center gap-2 px-8 py-2.5 bg-[#428E5F] text-white rounded-[8px] font-bold text-sm shadow-sm hover:bg-[#36754e] transition-all"
            >
              <Save size={16} /> Simpan Perubahan
            </button>
          )}
        </div>
      </div>

      {/* --- MODAL KONFIRMASI --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
           <div className="relative bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl text-center animate-in zoom-in duration-200">
              
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-white ring-4 ring-green-50/50">
                 <Check size={40} className="text-[#068A50]" strokeWidth={3} />
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-2">Simpan Perubahan?</h3>
              <p className="text-xs text-gray-500 mb-8 leading-relaxed px-4">
                  Apakah Anda yakin data yang dimasukkan sudah benar? Perubahan akan langsung disimpan ke sistem.
              </p>

              <div className="flex gap-3">
                 <button 
                    onClick={() => setShowConfirmModal(false)} 
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
                 >
                    Batal
                 </button>
                 
                 <button 
                    onClick={executeSubmit} 
                    disabled={isSaving}
                    className="flex-1 py-2.5 bg-[#068A50] text-white rounded-lg text-xs font-bold shadow-md hover:bg-[#057a46] cursor-pointer flex justify-center items-center gap-2"
                 >
                    {isSaving ? <Loader2 size={14} className="animate-spin"/> : "Ya, Simpan"}
                 </button>
              </div>
           </div>
        </div>
      )}

      <footer className="mt-8 text-center text-[11px] text-[#9E9E9E] uppercase tracking-widest">© Persis 212 Kudang</footer>
    </div>
  );
}

// Sub-komponen UI (Tidak Berubah)
function StepCircle({ num, label, active, current }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border transition-all 
        ${current ? 'bg-white border-[#428E5F] text-[#428E5F] shadow-md scale-110' : 
          active ? 'bg-[#428E5F] border-[#428E5F] text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
        {num}
      </div>
      <span className={`text-[12px] font-bold uppercase tracking-tight ${active ? 'text-[#2D2D2D]' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

function FormInput({ label, name, value, onChange, placeholder }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{label}</label>
      <input 
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[8px] text-[13px] text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#428E5F]/10 focus:border-[#428E5F] focus:bg-white transition-all"
      />
    </div>
  );
}

function FormSelect({ label, name, value, options, onChange }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{label}</label>
      <div className="relative">
        <select 
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[8px] text-[13px] text-gray-700 focus:outline-none focus:border-[#428E5F] focus:bg-white transition-all appearance-none cursor-pointer"
        >
          <option value="">Pilih {label}</option>
          {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
}