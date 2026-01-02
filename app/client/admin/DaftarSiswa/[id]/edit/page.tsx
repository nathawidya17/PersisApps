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
    <div className="ml-64 bg-[#F5F5F5] min-h-screen pb-12 px-10 pt-6 antialiased font-sans">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] text-[#9E9E9E] mb-4 font-medium">
        <span>Daftar Siswa</span> <span>/</span> <span>Detail Siswa</span> <span>/</span> <span className="text-[#068A50]">Edit Detail Siswa</span>
      </nav>

      {/* Header Title */}
      <div className="flex items-center gap-3 mb-8 cursor-pointer group" onClick={() => router.back()}>
        <ChevronLeft size={20} className="text-[#2D2D2D]" />
        <h2 className="text-lg font-bold text-[#2D2D2D]">Edit Detail Siswa</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] overflow-hidden">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between px-20 py-10 border-b border-[#F5F5F5]">
          <StepCircle num={1} label="Data Siswa" active={step >= 1} current={step === 1} />
          <div className="flex-grow h-[1px] bg-[#E0E0E0] mx-6"></div>
          <StepCircle num={2} label="Data Sekolah Sebelumnya" active={step >= 2} current={step === 2} />
          <div className="flex-grow h-[1px] bg-[#E0E0E0] mx-6"></div>
          <StepCircle num={3} label="Data Orang Tua" active={step >= 3} current={step === 3} />
        </div>

        {/* Form Body - Background White */}
        <div className="p-12 bg-white">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
              <FormInput label="Nama Siswa" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Masukkan nama siswa" />
              <FormSelect label="Jenis Kelamin" name="jenis_kelamin" value={formData.jenis_kelamin} options={["Putra", "Putri"]} onChange={handleChange} />
              <FormInput label="Anak Ke" name="anak_ke" value={formData.anak_ke} onChange={handleChange} placeholder="placeholder" />
              <FormInput label="Jumlah Saudara" name="jumlah_saudara" value={formData.jumlah_saudara} onChange={handleChange} placeholder="placeholder" />
              <FormInput label="No Handphone" name="no_hp" value={formData.no_hp} onChange={handleChange} placeholder="+62 0" />
              <FormInput label="Email" name="email" value={formData.email} onChange={handleChange} placeholder="placeholder" />
              <div className="col-span-2">
                <FormInput label="Alamat Lengkap" name="alamat" value={formData.alamat} onChange={handleChange} placeholder="placeholder" />
              </div>
              <FormInput label="RT" name="rt" value={formData.rt} onChange={handleChange} placeholder="placeholder" />
              <FormInput label="RW" name="rw" value={formData.rw} onChange={handleChange} placeholder="placeholder" />
              <FormInput label="Kode Pos" name="kode_pos" value={formData.kode_pos} onChange={handleChange} placeholder="placeholder" />
              <FormSelect label="Ukuran Baju Olahraga" name="ukuran_baju" value={formData.ukuran_baju} options={["S", "M", "L", "XL", "XXL"]} onChange={handleChange} />
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
              <FormInput label="Asal Sekolah" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleChange} placeholder="placeholder" />
              <FormInput label="Tahun Lulus" name="tahun_lulus" value={formData.tahun_lulus} onChange={handleChange} placeholder="placeholder" />
              <div className="col-span-2">
                <FormInput label="Alamat Sekolah" name="alamat_sekolah" value={formData.alamat_sekolah} onChange={handleChange} placeholder="placeholder" />
              </div>
              <FormInput label="NISN" name="NISN" value={formData.NISN} onChange={handleChange} placeholder="placeholder" />
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
              <h4 className="col-span-2 font-bold text-[#757575] text-[11px] uppercase tracking-wider">Data Ayah</h4>
              <FormInput label="Nama Ayah" name="nama_ayah" value={formData.nama_ayah} onChange={handleChange} placeholder="Nama lengkap ayah" />
              <FormInput label="Pekerjaan Ayah" name="pekerjaan_ayah" value={formData.pekerjaan_ayah} onChange={handleChange} placeholder="Pekerjaan ayah" />
              
              <h4 className="col-span-2 font-bold text-[#757575] text-[11px] uppercase tracking-wider mt-6">Data Ibu</h4>
              <FormInput label="Nama Ibu" name="nama_ibu" value={formData.nama_ibu} onChange={handleChange} placeholder="Nama lengkap ibu" />
              <FormInput label="Pekerjaan Ibu" name="pekerjaan_ibu" value={formData.pekerjaan_ibu} onChange={handleChange} placeholder="Pekerjaan ibu" />
            </div>
          )}
        </div>

        {/* Footer Navigation - Background Light Gray */}
        <div className="px-12 py-8 bg-[#FBFBFB] border-t border-[#F5F5F5] flex justify-end">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-8 py-3 text-[#757575] font-bold text-sm mr-4 hover:text-[#2D2D2D] transition-colors"
            >
              Kembali
            </button>
          )}
          {step < 3 ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-8 py-3 bg-[#428E5F] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#36754e] transition-all"
            >
              Lanjutkan <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-3 bg-[#428E5F] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#36754e] transition-all"
            >
              Simpan Perubahan
            </button>
          )}
        </div>
      </div>
      <p className="mt-6 text-center text-[10px] text-[#9E9E9E]">© Persis 212 Kudang</p>
    </div>
  );
}

// Sub-komponen UI
function StepCircle({ num, label, active, current }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all 
        ${current ? 'bg-white border-[#428E5F] text-[#428E5F] shadow-sm' : 
          active ? 'bg-[#428E5F] border-[#428E5F] text-white' : 'bg-white border-[#E0E0E0] text-[#9E9E9E]'}`}>
        {num}
      </div>
      <span className={`text-xs font-bold ${active ? 'text-[#2D2D2D]' : 'text-[#9E9E9E]'}`}>{label}</span>
    </div>
  );
}

function FormInput({ label, name, value, onChange, placeholder }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-[#2D2D2D] tracking-tight">{label}</label>
      <input 
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="px-4 py-3 bg-[#FCFCFC] border border-[#EEEEEE] rounded-lg text-xs text-[#757575] placeholder-[#BDBDBD] focus:outline-none focus:border-[#428E5F] focus:bg-white transition-all shadow-inner"
      />
    </div>
  );
}

function FormSelect({ label, name, value, options, onChange }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-[#2D2D2D] tracking-tight">{label}</label>
      <div className="relative">
        <select 
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full px-4 py-3 bg-[#FCFCFC] border border-[#EEEEEE] rounded-lg text-xs text-[#757575] focus:outline-none focus:border-[#428E5F] focus:bg-white transition-all appearance-none cursor-pointer shadow-inner"
        >
          <option value="">placeholder</option>
          {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-[#9E9E9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
}