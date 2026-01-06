"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function EditDetailSiswa() {
  const { id } = useParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});

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
        });
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.put(`/server/api/admin/DaftarSiswa/${id}`, formData);
      router.push(`/client/admin/DaftarSiswa/${id}`);
    } catch (error) {
      console.error("Gagal update data", error);
    }
  };

  if (loading) return <div className="ml-64 p-10 text-gray-400">Loading Form...</div>;

  return (
    /* Menggunakan px-5 pt-5 (20px) agar konsisten dengan halaman lain */
    <div className="ml-64 bg-gray-100 min-h-screen pb-10 px-5 pt-5 antialiased font-sans">
      
      {/* Breadcrumb - Spacing mb-5 (20px) */}
      <nav className="flex items-center gap-2 text-[11px] text-[#9E9E9E] mb-5 font-medium uppercase tracking-wider">
        <span>Daftar Siswa</span> <span>/</span> <span>Detail Siswa</span> <span>/</span> <span className="text-[#068A50]">Edit Detail</span>
      </nav>

      {/* Header Title - mb-5 (20px) */}
      <div className="flex items-center gap-3 mb-5 cursor-pointer group w-fit" onClick={() => router.back()}>
        <div className="p-1 hover:bg-gray-200 rounded-full transition-colors">
          <ChevronLeft size={20} className="text-[#2D2D2D]" />
        </div>
        <h2 className="text-xl font-bold text-[#2D2D2D]">Edit Detail Siswa</h2>
      </div>

      <div className="bg-white rounded-[12px] shadow-sm border border-[#EEEEEE] overflow-hidden">
        
        {/* Step Indicator Header - Padding 20px (p-5) */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-gray-50">
          <StepCircle num={1} label="Data Siswa" active={step >= 1} current={step === 1} />
          <div className={`flex-grow h-[2px] mx-4 transition-colors ${step > 1 ? 'bg-[#428E5F]' : 'bg-gray-100'}`}></div>
          <StepCircle num={2} label="Sekolah Asal" active={step >= 2} current={step === 2} />
          <div className={`flex-grow h-[2px] mx-4 transition-colors ${step > 2 ? 'bg-[#428E5F]' : 'bg-gray-100'}`}></div>
          <StepCircle num={3} label="Orang Tua" active={step >= 3} current={step === 3} />
        </div>

        {/* Form Body - Spacing gap-5 (20px) */}
        <div className="p-8">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-5">
              <FormInput label="Nama Siswa" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Masukkan nama lengkap" />
              <FormSelect label="Jenis Kelamin" name="jenis_kelamin" value={formData.jenis_kelamin} options={["Putra", "Putri"]} onChange={handleChange} />
              <FormInput label="Anak Ke" name="anak_ke" value={formData.anak_ke} onChange={handleChange} placeholder="Contoh: 1" />
              <FormInput label="Jumlah Saudara" name="jumlah_saudara" value={formData.jumlah_saudara} onChange={handleChange} placeholder="Contoh: 2" />
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
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-2.5 bg-[#428E5F] text-white rounded-[8px] font-bold text-sm shadow-sm hover:bg-[#36754e] transition-all"
            >
              Simpan Perubahan
            </button>
          )}
        </div>
      </div>
      <footer className="mt-8 text-center text-[11px] text-[#9E9E9E] uppercase tracking-widest">© Persis 212 Kudang</footer>
    </div>
  );
}

// Sub-komponen UI
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