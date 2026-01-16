"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  ChevronLeft, ChevronRight, Check, X, 
  AlertCircle, Loader2, Save, CalendarIcon, ChevronDown
} from "lucide-react";

// --- IMPORTS UNTUK DATE PICKER (Pastikan library ini terinstall) ---
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale"; // Rename 'id' jadi 'idLocale' biar gak bentrok sama useParams
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function EditDetailSiswa() {
  const { id } = useParams();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

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
          // Format tanggal dari DB (ISO String) ke YYYY-MM-DD untuk state awal
          tanggal_lahir: s.tanggal_lahir ? s.tanggal_lahir.split('T')[0] : "",
          tanggal_lahir_ayah: o.tanggal_lahir_ayah ? o.tanggal_lahir_ayah.split('T')[0] : "",
          tanggal_lahir_ibu: o.tanggal_lahir_ibu ? o.tanggal_lahir_ibu.split('T')[0] : "",
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

  // --- HANDLER INPUT TEXT BIASA ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = name === 'no_hp' || name === 'NISN' ? value.replace(/[^0-9]/g, '') : value;
    
    setFormData({ ...formData, [name]: numValue });
    
    // Validasi No HP
    if (name === 'no_hp' && numValue) {
      if (!numValue.startsWith("08")) {
        setFieldErrors(prev => ({ ...prev, no_hp: "Nomor HP harus dimulai dengan 08" }));
      } else if (numValue.length < 10 || numValue.length > 15) {
        setFieldErrors(prev => ({ ...prev, no_hp: "Nomor HP harus 10-15 digit" }));
      } else {
        setFieldErrors(prev => ({ ...prev, no_hp: "" }));
      }
    }
    
    // Validasi NISN
    if (name === 'NISN' && numValue) {
      if (numValue.length !== 10) {
        setFieldErrors(prev => ({ ...prev, NISN: "NISN harus 10 digit" }));
      } else {
        setFieldErrors(prev => ({ ...prev, NISN: "" }));
      }
    }
  };

  // --- HANDLER KHUSUS DATE PICKER ---
  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      // Format ke string YYYY-MM-DD agar sesuai dengan input type="date" standar
      const formatted = format(date, "yyyy-MM-dd");
      setFormData({ ...formData, [name]: formatted });
    } else {
      setFormData({ ...formData, [name]: "" });
    }
  };

  // --- TRIGGER MODAL KONFIRMASI ---
  const handlePreSubmit = () => {
    const errors: {[key: string]: string} = {};

    if (formData.email && !formData.email.includes("@")) errors.email = "Email harus mengandung tanda @";
    if (formData.no_hp) {
      if (!formData.no_hp.startsWith("08")) errors.no_hp = "Nomor HP harus dimulai dengan 08";
      else if (formData.no_hp.length < 10 || formData.no_hp.length > 15) errors.no_hp = "Nomor HP harus 10-15 digit";
    }
    if (formData.NISN && formData.NISN.length !== 10) errors.NISN = "NISN harus 10 digit";
    if (formData.nik && formData.nik.length !== 16) errors.nik = "NIK harus 16 digit";
    if (formData.no_kk && formData.no_kk.length !== 16) errors.no_kk = "No KK harus 16 digit";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setShowConfirmModal(true);
  };

  // --- EKSEKUSI SIMPAN ---
  const executeSubmit = async () => {
    setIsSaving(true);
    try {
      await axios.put(`/server/api/admin/DaftarSiswa/${id}`, formData);
      setShowConfirmModal(false);
      setNotification({ message: "Data siswa berhasil diperbarui!", type: 'success' });
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

  const isTahfidz = formData.jalur_pendaftaran?.toLowerCase() === "tahfidz";

  return (
    <div className="ml-64 bg-gray-100 min-h-screen pb-10 px-5 pt-5 antialiased font-sans relative">
      
      {/* NOTIFIKASI TOAST */}
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

      {/* Breadcrumb & Header */}
      <nav className="flex items-center gap-2 text-[11px] text-[#9E9E9E] mb-5 font-medium uppercase tracking-wider">
        <span>Daftar Siswa</span> <span>/</span> <span>Detail Siswa</span> <span>/</span> <span className="text-[#068A50]">Edit Detail</span>
      </nav>

      <div className="flex items-center gap-3 mb-5 cursor-pointer group w-fit" onClick={() => router.back()}>
        <div className="p-1 hover:bg-gray-200 rounded-full transition-colors">
          <ChevronLeft size={20} className="text-[#2D2D2D]" />
        </div>
        <h2 className="text-xl font-bold text-[#2D2D2D]">Edit Detail Siswa</h2>
      </div>

      <div className="bg-white rounded-[12px] shadow-sm border border-[#EEEEEE] overflow-hidden">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-gray-50">
          <StepCircle num={1} label="Data Siswa" active={step >= 1} current={step === 1} />
          <div className={`flex-grow h-[2px] mx-4 transition-colors ${step > 1 ? 'bg-[#428E5F]' : 'bg-gray-100'}`}></div>
          <StepCircle num={2} label="Sekolah Asal" active={step >= 2} current={step === 2} />
          <div className={`flex-grow h-[2px] mx-4 transition-colors ${step > 2 ? 'bg-[#428E5F]' : 'bg-gray-100'}`}></div>
          <StepCircle num={3} label="Orang Tua" active={step >= 3} current={step === 3} />
        </div>

        {/* Form Body */}
        <div className="p-8">
          
          {/* === STEP 1: DATA SISWA === */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                 <label className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Jalur Pendaftaran</label>
                 <input 
                    disabled 
                    value={formData.jalur_pendaftaran}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-[8px] text-[13px] text-gray-500 cursor-not-allowed capitalize font-medium"
                 />
              </div>
              
              <FormInput label="Nama Siswa" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Masukkan nama lengkap" />
              <FormSelect label="Jenis Kelamin" name="jenis_kelamin" value={formData.jenis_kelamin} options={["Laki-laki", "Perempuan"]} onChange={handleChange} />
              <FormInput label="Tempat Lahir" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} placeholder="Masukkan tempat lahir" />
              
              {/* DATE PICKER: TANGGAL LAHIR SISWA */}
              <DatePickerGroup 
                label="Tanggal Lahir" 
                name="tanggal_lahir" 
                value={formData.tanggal_lahir} 
                onChange={(date: Date | undefined) => handleDateChange("tanggal_lahir", date)} 
                placeholder="Pilih Tanggal Lahir"
              />

              {isTahfidz && (
                 <div className="col-span-1">
                    <FormInput label="Jumlah Hafalan (Juz)" name="jumlah_hafalan" value={formData.jumlah_hafalan} onChange={handleChange} placeholder="Contoh: 5 Juz" />
                 </div>
              )}

              <FormInput label="Anak Ke" name="anak_ke" value={formData.anak_ke} onChange={handleChange} placeholder="Contoh: 1" />
              <FormInput label="Jumlah Saudara" name="jumlah_saudara" value={formData.jumlah_saudara} onChange={handleChange} placeholder="Contoh: 2" />
              
              {/* NIK, KK, HP, Email (Validasi Display) */}
              <div>
                <FormInput label="NIK" name="nik" value={formData.nik} onChange={handleChange} placeholder="16 digit NIK" isError={!!fieldErrors.nik} />
                {fieldErrors.nik && <div className="flex items-center gap-2 mt-2 text-red-500 text-xs font-medium"><AlertCircle size={14} /> {fieldErrors.nik}</div>}
              </div>
              <div>
                <FormInput label="No KK" name="no_kk" value={formData.no_kk} onChange={handleChange} placeholder="16 digit No KK" isError={!!fieldErrors.no_kk} />
                {fieldErrors.no_kk && <div className="flex items-center gap-2 mt-2 text-red-500 text-xs font-medium"><AlertCircle size={14} /> {fieldErrors.no_kk}</div>}
              </div>
              <div>
                <FormInput label="No Handphone" name="no_hp" value={formData.no_hp} onChange={handleChange} placeholder="+62 ..." isError={!!fieldErrors.no_hp} maxLength={15} />
                {fieldErrors.no_hp && <div className="flex items-center gap-2 mt-2 text-red-500 text-xs font-medium"><AlertCircle size={14} /> {fieldErrors.no_hp}</div>}
              </div>
              <div>
                <FormInput label="Email" name="email" value={formData.email} onChange={handleChange} placeholder="email@contoh.com" isError={!!fieldErrors.email} />
                {fieldErrors.email && <div className="flex items-center gap-2 mt-2 text-red-500 text-xs font-medium"><AlertCircle size={14} /> {fieldErrors.email}</div>}
              </div>

              <div className="col-span-2">
                <FormInput label="Alamat Lengkap" name="alamat" value={formData.alamat} onChange={handleChange} placeholder="Jl. Raya No..." />
              </div>
              <div className="grid grid-cols-2 col-span-2 gap-5">
                <FormInput label="RT" name="rt" value={formData.rt} onChange={handleChange} placeholder="00" />
                <FormInput label="RW" name="rw" value={formData.rw} onChange={handleChange} placeholder="00" />
              </div>
              <FormInput label="Kode Pos" name="kode_pos" value={formData.kode_pos} onChange={handleChange} placeholder="00000" />
              <FormSelect label="Ukuran Baju Olahraga" name="ukuran_baju" value={formData.ukuran_baju} options={["S", "M", "L", "XL", "XXL"]} onChange={handleChange} />
            </div>
          )}

          {/* === STEP 2: SEKOLAH ASAL === */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-5">
                <div>
                <FormInput label="NISN" name="NISN" value={formData.NISN} onChange={handleChange} placeholder="10 digit NISN" isError={!!fieldErrors.NISN} maxLength={10} />
                {fieldErrors.NISN && <div className="flex items-center gap-2 mt-2 text-red-500 text-xs font-medium"><AlertCircle size={14} /> {fieldErrors.NISN}</div>}
              </div>
              <FormInput label="Nama Asal Sekolah" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleChange} placeholder="Nama sekolah" />
              <FormInput label="Tahun Lulus" name="tahun_lulus" value={formData.tahun_lulus} onChange={handleChange} placeholder="Contoh: 2024" />
              <div className="col-span-1">
                <FormInput label="Alamat Sekolah" name="alamat_sekolah" value={formData.alamat_sekolah} onChange={handleChange} placeholder="Alamat lengkap sekolah" />
              </div>
              <FormInput label="Kode Pos Sekolah" name="kode_pos_sekolah" value={formData.kode_pos_sekolah} onChange={handleChange} placeholder="00000" />
            </div>
          )}

          {/* === STEP 3: DATA ORANG TUA === */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-5">
              
              {/* --- DATA AYAH --- */}
              <h4 className="col-span-2 font-bold text-[#9E9E9E] text-[10px] uppercase tracking-widest border-b pb-2">Data Ayah</h4>
              <FormInput label="Nama Ayah" name="nama_ayah" value={formData.nama_ayah} onChange={handleChange} placeholder="Nama lengkap ayah" />
              <FormInput label="Tempat Lahir Ayah" name="tempat_lahir_ayah" value={formData.tempat_lahir_ayah} onChange={handleChange} placeholder="Tempat lahir ayah" />
              
              {/* Date Picker Ayah */}
              <DatePickerGroup 
                label="Tanggal Lahir Ayah" 
                name="tanggal_lahir_ayah" 
                value={formData.tanggal_lahir_ayah} 
                onChange={(date: Date | undefined) => handleDateChange("tanggal_lahir_ayah", date)} 
                placeholder="Pilih Tanggal"
              />

              <FormInput label="Pekerjaan Ayah" name="pekerjaan_ayah" value={formData.pekerjaan_ayah} onChange={handleChange} placeholder="Pekerjaan ayah" />
              
              {/* Dropdown Pendidikan Ayah */}
              <FormSelect 
                label="Pendidikan Ayah" 
                name="pendidikan_ayah" 
                value={formData.pendidikan_ayah} 
                onChange={handleChange} 
                options={["SD", "SMP", "SMA", "S1", "S2", "S3"]} 
              />
              
              {/* Radio Group Penghasilan Ayah */}
              <div className="col-span-2">
                 <RadioGroup 
                    label="Penghasilan Ayah" 
                    name="penghasilan_ayah" 
                    selected={formData.penghasilan_ayah} 
                    onChange={handleChange} 
                    options={["Kurang Dari 1 Juta", "1-3 Juta", "3-5 Juta", "Lebih Dari 5 Juta"]} 
                 />
              </div>

              {/* --- DATA IBU --- */}
              <h4 className="col-span-2 font-bold text-[#9E9E9E] text-[10px] uppercase tracking-widest border-b pb-2 mt-4">Data Ibu</h4>
              <FormInput label="Nama Ibu" name="nama_ibu" value={formData.nama_ibu} onChange={handleChange} placeholder="Nama lengkap ibu" />
              <FormInput label="Tempat Lahir Ibu" name="tempat_lahir_ibu" value={formData.tempat_lahir_ibu} onChange={handleChange} placeholder="Tempat lahir ibu" /> 
              
              {/* Date Picker Ibu */}
              <DatePickerGroup 
                label="Tanggal Lahir Ibu" 
                name="tanggal_lahir_ibu" 
                value={formData.tanggal_lahir_ibu} 
                onChange={(date: Date | undefined) => handleDateChange("tanggal_lahir_ibu", date)} 
                placeholder="Pilih Tanggal"
              />

              <FormInput label="Pekerjaan Ibu" name="pekerjaan_ibu" value={formData.pekerjaan_ibu} onChange={handleChange} placeholder="Pekerjaan ibu" />
              
              {/* Dropdown Pendidikan Ibu */}
              <FormSelect 
                label="Pendidikan Ibu" 
                name="pendidikan_ibu" 
                value={formData.pendidikan_ibu} 
                onChange={handleChange} 
                options={["SD", "SMP", "SMA", "S1", "S2", "S3"]} 
              />

              {/* Radio Group Penghasilan Ibu */}
              <div className="col-span-2">
                <RadioGroup 
                    label="Penghasilan Ibu" 
                    name="penghasilan_ibu" 
                    selected={formData.penghasilan_ibu} 
                    onChange={handleChange} 
                    options={["Kurang Dari 1 Juta", "1-3 Juta", "3-5 Juta", "Lebih Dari 5 Juta"]} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 text-gray-500 font-bold text-sm hover:text-gray-800 transition-colors">Kembali</button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="flex items-center gap-2 px-8 py-2.5 bg-[#428E5F] text-white rounded-[8px] font-bold text-sm shadow-sm hover:bg-[#36754e] transition-all">Lanjutkan <ChevronRight size={16} /></button>
          ) : (
            <button onClick={handlePreSubmit} className="flex items-center gap-2 px-8 py-2.5 bg-[#428E5F] text-white rounded-[8px] font-bold text-sm shadow-sm hover:bg-[#36754e] transition-all"><Save size={16} /> Simpan Perubahan</button>
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
              <p className="text-xs text-gray-500 mb-8 leading-relaxed px-4">Apakah Anda yakin data yang dimasukkan sudah benar? Perubahan akan langsung disimpan ke sistem.</p>
              <div className="flex gap-3">
                 <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer">Batal</button>
                 <button onClick={executeSubmit} disabled={isSaving} className="flex-1 py-2.5 bg-[#068A50] text-white rounded-lg text-xs font-bold shadow-md hover:bg-[#057a46] cursor-pointer flex justify-center items-center gap-2">
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

// --- SUB KOMPONEN (UI HELPERS) ---

function StepCircle({ num, label, active, current }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border transition-all ${current ? 'bg-white border-[#428E5F] text-[#428E5F] shadow-md scale-110' : active ? 'bg-[#428E5F] border-[#428E5F] text-white' : 'bg-white border-gray-200 text-gray-400'}`}>{num}</div>
      <span className={`text-[12px] font-bold uppercase tracking-tight ${active ? 'text-[#2D2D2D]' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

function FormInput({ label, name, value, onChange, placeholder, isError, maxLength }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{label}</label>
      <input 
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`px-4 py-2.5 bg-gray-50 border rounded-[8px] text-[13px] text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#428E5F]/10 focus:bg-white transition-all ${isError ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#428E5F]'}`}
      />
    </div>
  );
}

// DROPDOWN (SELECT) YANG DIPERBARUI
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
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

// DATE PICKER COMPONENT (Shadcn Style)
function DatePickerGroup({ label, value, onChange, placeholder }: any) {
  const dateValue = value ? new Date(value) : undefined;
  return (
    <div className="flex flex-col gap-2 text-left">
      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal py-2.5 h-auto bg-gray-50 border-gray-200 rounded-[8px] text-[13px] hover:bg-white hover:text-gray-700", !value && "text-muted-foreground")}>
            {value ? format(new Date(value), "PPP", { locale: idLocale }) : <span className="text-gray-400">{placeholder}</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-gray-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dateValue} onSelect={onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus locale={idLocale} captionLayout="dropdown" fromYear={1960} toYear={2030} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// RADIO GROUP COMPONENT (Untuk Penghasilan)
function RadioGroup({ label, name, selected, onChange, options }: any) {
  return (
    <div className="flex flex-col gap-2 text-left">
      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{label}</label>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {options.map((opt: string) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer group bg-gray-50 border border-gray-200 p-2.5 rounded-[8px] hover:border-gray-300 transition-all">
            <input type="radio" name={name} value={opt} checked={selected === opt} onChange={onChange} className="sr-only" />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected === opt ? 'border-[#428E5F] bg-green-50' : 'border-gray-300'}`}>
              {selected === opt && <div className="w-2 h-2 bg-[#428E5F] rounded-full" />}
            </div>
            <span className={`text-[12px] ${selected === opt ? 'text-[#428E5F] font-bold' : 'text-gray-600'}`}>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}