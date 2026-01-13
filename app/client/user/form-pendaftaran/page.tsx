"use client";

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/user/Navbar';
import Footer from '@/components/user/Footer';
import { Mail, Phone, MapPin, Check, Copy, Upload, ChevronDown, Plus, Trash2, Info, CalendarIcon, Loader2, AlertCircle } from 'lucide-react';

// IMPORTS SHADCN & DATE UTILS
import { format } from "date-fns";
import { id } from "date-fns/locale"; 
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// KONFIGURASI PEMBAYARAN DARI ENV
const PAYMENT_CONFIG = {
  bank: process.env.NEXT_PUBLIC_BANK_NAME || "Mandiri",
  accountNumber: process.env.NEXT_PUBLIC_ACCOUNT_NUMBER || "1310044442988",
  accountHolder: process.env.NEXT_PUBLIC_ACCOUNT_HOLDER || "Een Purucut",
  amountPendaftaran: process.env.NEXT_PUBLIC_REGISTRATION_FEE || "200.000"
};

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Transfer");
  const [showCopyToast, setShowCopyToast] = useState(false);
  
  // State Loading & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingNisn, setIsCheckingNisn] = useState(false); 
  const [nisnError, setNisnError] = useState(""); 
  
  // State Error Global
  const [submitError, setSubmitError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    jalur_pendaftaran: "",
    nama_lengkap: "", jenis_kelamin: "" as any, tempat_lahir: "", tanggal_lahir: "", anak_ke: "", jumlah_saudara: "",
    no_hp: "", email: "", alamat_rumah: "", rt: "", rw: "", kode_pos: "", ukuran_baju: "" as any,
    asal_sekolah: "", tahun_lulus: "", alamat_sekolah: "", kode_pos_sekolah: "", nisn: "",
    nama_ayah: "", tempat_lahir_ayah: "", tanggal_lahir_ayah: "", pendidikan_ayah: "", pekerjaan_ayah: "", penghasilan_ayah: "",
    nama_ibu: "", tempat_lahir_ibu: "", tanggal_lahir_ibu: "", pendidikan_ibu: "", pekerjaan_ibu: "", penghasilan_ibu: "",
    alamat_ortu: "", rt_ortu: "", rw_ortu: "", kodepos_ortu: "", no_hp_ortu: "",
    no_hp_orang_tua: "", jumlah_dibayar: PAYMENT_CONFIG.amountPendaftaran, 
    bukti_pembayaran: null as File | null
  });

  const [prestasiList, setPrestasiList] = useState([{ 
    nama: "", jenis_prestasi: "", tingkat: "", peringkat: "", tahun: "" , penyelenggara: ""
  }]);

  useEffect(() => {
    const savedJalur = localStorage.getItem('pendaftaran_jalur');
    if (savedJalur) {
      const formatted = savedJalur.charAt(0).toUpperCase() + savedJalur.slice(1);
      setFormData(prev => ({ ...prev, jalur_pendaftaran: formatted }));
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const isPrestasi = formData.jalur_pendaftaran === "Prestasi";
  const currentYear = new Date().getFullYear();

  // --- LOGIC GENERATE STEP LIST DYNAMICALLY ---
  const stepList = [
    { num: 1, label: "Data Siswa" },
    { num: 2, label: "Data Sekolah" }, // Label dipendekkan untuk mobile
    ...(isPrestasi ? [{ num: 3, label: "Prestasi" }] : []),
    { num: isPrestasi ? 4 : 3, label: "Data Ortu" },
    { num: isPrestasi ? 5 : 4, label: "Konfirmasi" }
  ];

  const isYearValid = (dateString: string, isFullDate: boolean = false) => {
    if (!dateString) return true;
    let year;
    if (isFullDate) {
      year = parseInt(dateString.split('-')[0]);
    } else {
      year = parseInt(dateString);
    }
    return year <= currentYear;
  };

  const validateYearLogic = () => {
    if (step === 1) {
      if (!isYearValid(formData.tanggal_lahir, true)) {
        alert("Tanggal lahir siswa tidak boleh melebihi tahun saat ini.");
        return false;
      }
    }
    if (step === 2) {
      if (!isYearValid(formData.tahun_lulus)) {
        alert(`Tahun lulus tidak boleh melebihi tahun saat ini (${currentYear}).`);
        return false;
      }
    }
    if (isPrestasi && step === 3) {
      for (let i = 0; i < prestasiList.length; i++) {
        if (!isYearValid(prestasiList[i].tahun)) {
          alert(`Tahun prestasi pada baris ke-${i + 1} tidak boleh melebihi tahun saat ini.`);
          return false;
        }
      }
    }
    const stepOrangTua = isPrestasi ? 4 : 3;
    if (step === stepOrangTua) {
      if (!isYearValid(formData.tanggal_lahir_ayah, true)) {
        alert("Tanggal lahir Ayah tidak boleh melebihi tahun saat ini.");
        return false;
      }
      if (!isYearValid(formData.tanggal_lahir_ibu, true)) {
        alert("Tanggal lahir Ibu tidak boleh melebihi tahun saat ini.");
        return false;
      }
    }
    return true;
  };

  const nextStep = async () => { 
    if (!isStepValid()) return;
    if (!validateYearLogic()) return;
    setNisnError("");

    if (step === 2) {
      setIsCheckingNisn(true);
      try {
        const response = await fetch(`/server/api/user/pendaftaran?nisn=${formData.nisn}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.exists) {
          setNisnError("NISN ini sudah terdaftar. Mohon periksa kembali atau hubungi admin.");
          setIsCheckingNisn(false);
          return;
        }
      } catch (error) {
        alert("Terjadi kesalahan koneksi saat mengecek NISN.");
        setIsCheckingNisn(false);
        return;
      }
      setIsCheckingNisn(false);
    }
    setStep(step + 1); 
  };

  const prevStep = () => { 
    setStep(step - 1); 
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, '') }));
    if (name === 'nisn') setNisnError("");
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      const formatted = format(date, "yyyy-MM-dd");
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, bukti_pembayaran: e.target.files![0] }));
      setSubmitError(""); 
    }
  };

  const addPrestasi = () => setPrestasiList([...prestasiList, { nama: "", jenis_prestasi: "", tingkat: "", peringkat: "", penyelenggara: "", tahun: "" }]);
  const removePrestasi = (index: number) => { if (prestasiList.length > 1) setPrestasiList(prestasiList.filter((_, i) => i !== index)); };
  const handlePrestasiChange = (index: number, field: string, value: string) => {
    const newList = [...prestasiList];
    newList[index] = { ...newList[index], [field]: value };
    setPrestasiList(newList);
  };

  const handleSubmit = async () => {
    if (!validateYearLogic()) return;
    setIsSubmitting(true);
    setSubmitError(""); 

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "bukti_pembayaran" && value !== null) {
          data.append(key, value.toString());
        }
      });
      if (formData.bukti_pembayaran && paymentMethod === "Transfer") {
        data.append("bukti_pembayaran", formData.bukti_pembayaran);
      }
      data.append("prestasi", JSON.stringify(prestasiList));
      data.append("paymentMethod", paymentMethod);

      const response = await fetch('/server/api/user/pendaftaran', {
        method: 'POST',
        body: data, 
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Server error: Respon tidak valid");
      }

      if (response.ok) {
  // === TAMBAHKAN KODE INI ===
  localStorage.setItem('ppdb_success_nama', formData.nama_lengkap);
  localStorage.setItem('ppdb_success_nisn', formData.nisn || "-");
  localStorage.setItem('ppdb_success_metode', paymentMethod);
  // ==========================

  window.location.href = "/client/user/success"; 
}
    } catch (error: any) {
      setSubmitError("Koneksi Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    if (step === 1) return formData.jalur_pendaftaran && formData.nama_lengkap && formData.jenis_kelamin && formData.tempat_lahir && formData.tanggal_lahir && formData.anak_ke && formData.jumlah_saudara && formData.no_hp && formData.email && formData.alamat_rumah && formData.rt && formData.rw && formData.kode_pos && formData.ukuran_baju;
    if (step === 2) return formData.nisn && formData.asal_sekolah && formData.alamat_sekolah && formData.tahun_lulus && formData.kode_pos_sekolah;
    if (isPrestasi && step === 3) return prestasiList.every(item => item.nama && item.jenis_prestasi && item.tingkat && item.peringkat && item.tahun && item.penyelenggara);
    const stepOrangTua = isPrestasi ? 4 : 3;
    if (step === stepOrangTua) return formData.nama_ayah && formData.tempat_lahir_ayah && formData.tanggal_lahir_ayah && formData.pekerjaan_ayah && formData.pendidikan_ayah && formData.penghasilan_ayah && formData.nama_ibu && formData.tempat_lahir_ibu && formData.tanggal_lahir_ibu && formData.pekerjaan_ibu && formData.pendidikan_ibu && formData.penghasilan_ibu && formData.no_hp_orang_tua;
    if (step === (isPrestasi ? 5 : 4)) return paymentMethod === "Cash" ? formData.jumlah_dibayar !== "" : (formData.jumlah_dibayar !== "" && formData.bukti_pembayaran !== null);
    return true; 
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#333333] relative text-left">
      {showCopyToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] bg-gray-800 text-white px-4 py-2 rounded-lg text-sm shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check size={16} className="text-[#428E5F]" /> Berhasil menyalin ke papan klip
        </div>
      )}

      <Navbar />
      <main className="max-w-[1250px] mx-auto px-4 md:px-6 py-10">

        {/* --- KHUSUS MOBILE: CARD HEADER & STEPPER --- */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Form Pendaftaran Calon Siswa</h2>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
              Isi formulir pendaftaran calon siswa Madrasah Aliyah Pesantren Persis Kudang 212 dengan data yang lengkap dan benar.
            </p>

            {/* Mobile Stepper Horizontal */}
            <div className="flex items-center justify-between">
              {stepList.map((item) => (
                <div key={item.num} className="flex items-center gap-2">
                   {/* Circle Number */}
                  <div className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border transition-colors
                    ${step === item.num 
                      ? 'border-[#428E5F] text-[#428E5F] bg-green-50' 
                      : 'border-gray-200 text-gray-400'}
                  `}>
                    {item.num}
                  </div>
                  
                  {/* Label Text (Hanya muncul jika step aktif) */}
                  {step === item.num && (
                    <span className="text-[#428E5F] font-bold text-xs animate-in fade-in slide-in-from-left-2 whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* --- END KHUSUS MOBILE --- */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Alur (DESKTOP ONLY - hidden on Mobile) */}
          <div className="hidden lg:block lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 border-b border-gray-50 pb-4">Alur Pendaftaran</h2>
              <div className="space-y-6 mt-6">
                <StepItem number={1} title="Data Siswa" active={step === 1} completed={step > 1} />
                <StepItem number={2} title="Data Sekolah Sebelumnya" active={step === 2} completed={step > 2} />
                {isPrestasi && <StepItem number={3} title="Prestasi" active={step === 3} completed={step > 3} />}
                <StepItem number={isPrestasi ? 4 : 3} title="Data Orang Tua" active={step === (isPrestasi ? 4 : 3)} completed={step > (isPrestasi ? 4 : 3)} />
                <StepItem number={isPrestasi ? 5 : 4} title="Konfirmasi Pembayaran" active={step === (isPrestasi ? 5 : 4)} completed={step > (isPrestasi ? 5 : 4)} />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-5 text-[14px]">Kontak Informasi & Asrama</h3>
              <div className="space-y-4 text-left">
                <ContactInfo icon={<Mail size={16}/>} text="persiskudang@gmail.com" />
                <ContactInfo icon={<Phone size={16}/>} text="+62 811-2222-3333" />
                <ContactInfo icon={<MapPin size={16}/>} text="Wanaraja, Garut, Jawa Barat 44183" />
              </div>
            </div>
          </div>

          {/* Form Utama */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">
                  {step === 1 ? "Data Siswa" : step === 2 ? "Sekolah Asal" : (isPrestasi && step === 3) ? "Prestasi Calon Siswa" : (step === (isPrestasi ? 5 : 4) ? "Konfirmasi Pembayaran" : "Data Orang Tua")}
                </h2>
              </div>

              <div className="p-8 flex-grow">
                
                {/* STEP 1: DATA SISWA - (DENGAN MAXLENGTH) */}
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                    <div className="md:col-span-2">
                        <SelectGroup label="Jalur Pendaftaran" name="jalur_pendaftaran" value={formData.jalur_pendaftaran} onChange={handleChange} options={["Umum", "Tahfidz", "Prestasi"]} />
                    </div>
                    {/* Batasi nama 100 karakter */}
                    <InputGroup label="Nama Siswa" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Nama lengkap" maxLength={100} />
                    <SelectGroup label="Jenis Kelamin" name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} options={["Putra", "Putri"]} />
                    <InputGroup label="Tempat Lahir" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} placeholder="Contoh: Garut" maxLength={50} />
                    
                    <DatePickerGroup 
                      label="Tanggal Lahir" 
                      name="tanggal_lahir" 
                      value={formData.tanggal_lahir} 
                      onChange={(date: Date | undefined) => handleDateChange("tanggal_lahir", date)} 
                      placeholder="Pilih Tanggal Lahir"
                    />

                    {/* Batasi Angka */}
                    <InputGroup label="Anak Ke" name="anak_ke" value={formData.anak_ke} onChange={handleNumberChange} placeholder="Contoh: 1" maxLength={2} />
                    <InputGroup label="Jumlah Saudara" name="jumlah_saudara" value={formData.jumlah_saudara} onChange={handleNumberChange} placeholder="0" maxLength={2} />
                    <InputGroup label="No HP (WA)" name="no_hp" value={formData.no_hp} onChange={handleNumberChange} placeholder="08xxxxxxxx" maxLength={15} />
                    <InputGroup label="Email" name="email" value={formData.email} onChange={handleChange} placeholder="email@gmail.com" maxLength={100} />
                    <div className="md:col-span-2"><InputGroup label="Alamat Lengkap" name="alamat_rumah" value={formData.alamat_rumah} onChange={handleChange} placeholder="Jl. Raya No. 1" maxLength={255} /></div>
                    
                    {/* Batasi RT/RW 5 karakter (Sesuai request agar aman database) */}
                    <InputGroup label="RT" name="rt" value={formData.rt} onChange={handleNumberChange} placeholder="00" maxLength={5} />
                    <InputGroup label="RW" name="rw" value={formData.rw} onChange={handleNumberChange} placeholder="00" maxLength={5} />
                    <InputGroup label="Kode Pos" name="kode_pos" value={formData.kode_pos} onChange={handleNumberChange} placeholder="xxxxx" maxLength={5} />
                    <SelectGroup label="Ukuran Baju Olahraga" name="ukuran_baju" value={formData.ukuran_baju} onChange={handleChange} options={["S", "M", "L", "XL", "XXL"]} />
                  </div>
                )}

                {/* STEP 2: SEKOLAH ASAL - (DENGAN MAXLENGTH) */}
                {step === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                    <div className="md:col-span-1">
                      <InputGroup 
                        label="NISN" 
                        name="nisn" 
                        value={formData.nisn} 
                        onChange={handleNumberChange} 
                        placeholder="10 Digit NISN" 
                        maxLength={10} 
                        isError={!!nisnError} 
                      />
                      {nisnError && (
                        <div className="flex items-center gap-2 mt-2 text-red-500 text-xs font-medium animate-in slide-in-from-top-1">
                          <AlertCircle size={14} /> {nisnError}
                        </div>
                      )}
                    </div>
                    
                    <InputGroup label="Nama Sekolah Asal" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleChange} placeholder="SMP/MTs Asal" maxLength={100} />
                    <div className="md:col-span-2"><InputGroup label="Alamat Sekolah" name="alamat_sekolah" value={formData.alamat_sekolah} onChange={handleChange} placeholder="Alamat lengkap sekolah asal" maxLength={255} /></div>
                    <InputGroup label="Tahun Lulus" name="tahun_lulus" value={formData.tahun_lulus} onChange={handleNumberChange} placeholder="Contoh: 2025" maxLength={4} />
                    <InputGroup label="Kode Pos Sekolah" name="kode_pos_sekolah" value={formData.kode_pos_sekolah} onChange={handleNumberChange} placeholder="xxxxx" maxLength={5}/>
                  </div>
                )}

                {/* STEP 3: PRESTASI - (DENGAN MAXLENGTH) */}
                {isPrestasi && step === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {prestasiList.map((item, index) => (
                      <div key={index} className="border-b border-gray-100 pb-8 last:border-0 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                          <div className="space-y-2 w-full"><label className="text-[13px] font-bold text-gray-700">Nama Prestasi</label>
                            <input value={item.nama} onChange={(e) => handlePrestasiChange(index, "nama", e.target.value)} placeholder="OSN" className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none text-sm" maxLength={100} />
                          </div>
                          <div className="space-y-2 w-full"><label className="text-[13px] font-bold text-gray-700">Jenis Prestasi</label>
                            <select value={item.jenis_prestasi} onChange={(e) => handlePrestasiChange(index, "jenis_prestasi", e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm">
                              <option value="">Pilih</option><option value="Akademik">Akademik</option><option value="Non_Akademik">Non Akademik</option>
                            </select>
                          </div>
                          <div className="space-y-2 w-full"><label className="text-[13px] font-bold text-gray-700">Tingkat</label>
                            <select value={item.tingkat} onChange={(e) => handlePrestasiChange(index, "tingkat", e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm">
                              <option value="">Pilih</option><option value="Sekolah">Sekolah</option><option value="Kecamatan">Kecamatan</option><option value="Kabupaten">Kabupaten</option><option value="Provinsi">Provinsi</option><option value="Nasional">Nasional</option><option value="Internasional">Internasional</option>
                            </select>
                          </div>
                          <div className="space-y-2 w-full"><label className="text-[13px] font-bold text-gray-700">Peringkat</label>
                            <input value={item.peringkat} onChange={(e) => handlePrestasiChange(index, "peringkat", e.target.value)} placeholder="1" className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm" maxLength={30} />
                          </div>
                          <div className="space-y-2 w-full"><label className="text-[13px] font-bold text-gray-700">Tahun</label>
                            <input value={item.tahun} onChange={(e) => handlePrestasiChange(index, "tahun", e.target.value)} placeholder="2024" className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm" maxLength={4} />
                          </div>
                          <div className="space-y-2 w-full"><label className="text-[13px] font-bold text-gray-700">Penyelenggara</label>
                            <input value={item.penyelenggara} onChange={(e) => handlePrestasiChange(index, "penyelenggara", e.target.value)} placeholder="Kemdikbud" className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm" maxLength={100} />
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={addPrestasi} className="p-3 bg-[#428E5F] text-white rounded-lg"><Plus size={20}/></button>
                            {prestasiList.length > 1 && <button type="button" onClick={() => removePrestasi(index)} className="p-3 bg-red-50 text-red-500 rounded-lg"><Trash2 size={20}/></button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* STEP DATA ORANG TUA - (DENGAN MAXLENGTH) */}
                {step === (isPrestasi ? 4 : 3) && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputGroup label="Nama Ayah" name="nama_ayah" value={formData.nama_ayah} onChange={handleChange} placeholder="Ayah" maxLength={100} />
                      <InputGroup label="Tempat Lahir" name="tempat_lahir_ayah" value={formData.tempat_lahir_ayah} onChange={handleChange} placeholder="Garut" maxLength={50} />
                      
                      <DatePickerGroup 
                        label="Tanggal Lahir" 
                        name="tanggal_lahir_ayah" 
                        value={formData.tanggal_lahir_ayah} 
                        onChange={(date: Date | undefined) => handleDateChange("tanggal_lahir_ayah", date)} 
                        placeholder="Pilih Tanggal Lahir"
                      />

                      <InputGroup label="Pekerjaan" name="pekerjaan_ayah" value={formData.pekerjaan_ayah} onChange={handleChange} placeholder="PNS" maxLength={50} />
                      <SelectGroup label="Pendidikan" name="pendidikan_ayah" value={formData.pendidikan_ayah} onChange={handleChange} options={["SD", "SMP", "SMA", "S1","S2","S3"]} />
                    </div>
                    <RadioGroup label="Penghasilan Ayah" name="penghasilan_ayah" selected={formData.penghasilan_ayah} onChange={handleChange} options={["Kurang Dari 1 Juta", "1-3 Juta", "3-5 Juta", "Lebih Dari 5 Juta"]} />
                    <hr />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputGroup label="Nama Ibu" name="nama_ibu" value={formData.nama_ibu} onChange={handleChange} placeholder="Ibu" maxLength={100} />
                      <InputGroup label="Tempat Lahir" name="tempat_lahir_ibu" value={formData.tempat_lahir_ibu} onChange={handleChange} placeholder="Garut" maxLength={50} />
                      
                      <DatePickerGroup 
                        label="Tanggal Lahir" 
                        name="tanggal_lahir_ibu" 
                        value={formData.tanggal_lahir_ibu} 
                        onChange={(date: Date | undefined) => handleDateChange("tanggal_lahir_ibu", date)} 
                        placeholder="Pilih Tanggal Lahir"
                      />

                      <InputGroup label="Pekerjaan" name="pekerjaan_ibu" value={formData.pekerjaan_ibu} onChange={handleChange} placeholder="PNS" maxLength={50} />
                      <SelectGroup label="Pendidikan" name="pendidikan_ibu" value={formData.pendidikan_ibu} onChange={handleChange} options={["SD", "SMP", "SMA", "S1","S2","S3"]} />
                    </div>
                    <RadioGroup label="Penghasilan Ibu" name="penghasilan_ibu" selected={formData.penghasilan_ibu} onChange={handleChange} options={["Kurang Dari 1 Juta", "1-3 Juta", "3-5 Juta", "Lebih Dari 5 Juta"]} />
                    <InputGroup label="No Hp Orang Tua" name="no_hp_orang_tua" value={formData.no_hp_orang_tua} onChange={handleNumberChange} placeholder="081234567890" maxLength={15} />
                    <hr />
                  </div>
                )}

                {/* STEP KONFIRMASI PEMBAYARAN */}
                {step === (isPrestasi ? 5 : 4) && (
                  <div className="space-y-6 animate-in fade-in duration-300 text-left">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-gray-700">Metode Pembayaran</label>
                      <div className="relative">
                        <select 
                          value={paymentMethod} 
                          onChange={(e) => setPaymentMethod(e.target.value)} 
                          className="w-full px-4 py-3 rounded-lg border border-gray-100 outline-none text-sm bg-gray-50 appearance-none cursor-pointer font-medium"
                        >
                          <option value="Transfer">Transfer</option>
                          <option value="Cash">Cash</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      </div>
                    </div>

                    {paymentMethod === "Transfer" && (
                      <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                        <InputReadOnly label="Bank" value={PAYMENT_CONFIG.bank} />
                        <div className="space-y-2">
                           <label className="text-[13px] font-bold text-gray-700">Nomor Rekening</label>
                           <div className="relative">
                              <input type="text" value={PAYMENT_CONFIG.accountNumber} disabled className="w-full px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 text-gray-600 text-sm font-medium" />
                              <button type="button" onClick={() => handleCopy(PAYMENT_CONFIG.accountNumber)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-md text-[#428E5F]"><Copy size={16} /></button>
                           </div>
                        </div>
                        <InputReadOnly label="Atas Nama" value={PAYMENT_CONFIG.accountHolder} />
                      </div>
                    )}
                
                    <div className="space-y-5">
                        <InputReadOnly label="Jumlah Tagihan Pendaftaran" value={`IDR ${PAYMENT_CONFIG.amountPendaftaran}`} />
                      <InputGroup 
                        label="Jumlah yang akan dibayar" 
                        name="jumlah_dibayar" 
                        value={formData.jumlah_dibayar} 
                        onChange={handleNumberChange} 
                        placeholder={`Contoh: ${PAYMENT_CONFIG.amountPendaftaran}`} 
                      />
                      
                      {paymentMethod === "Cash" && (
                        <div className="p-5 bg-green-50 rounded-xl border border-green-100 flex gap-4 animate-in zoom-in duration-300">
                          <div className="w-10 h-10 bg-[#428E5F] rounded-full flex items-center justify-center shrink-0"><Info className="text-white" size={20} /></div>
                          <div>
                            <p className="font-bold text-[#428E5F] text-sm">Pembayaran Tunai (Cash)</p>
                            <p className="text-xs text-gray-600 mt-1">Selesaikan pendaftaran online ini, lalu lakukan pembayaran tunai di loket sekolah untuk konfirmasi pendaftaran.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {paymentMethod === "Transfer" && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <label className="text-[13px] font-bold text-gray-700">Bukti Pembayaran</label>
                        <div 
                          onClick={() => fileInputRef.current?.click()} 
                          className={`
                            border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group
                            ${submitError ? 'border-red-300 bg-red-50/10' : 'border-gray-200 bg-white hover:border-[#428E5F]'}
                          `}
                        >
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                          {formData.bukti_pembayaran ? (
                            <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-lg">
                              <Check size={18} className="text-[#428E5F]" /><span className="text-sm font-bold text-gray-700">{formData.bukti_pembayaran.name}</span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-100 transition-colors">
                                <Upload size={24} className="text-gray-400 group-hover:text-[#428E5F]" />
                              </div>
                              <p className="text-[13px] font-medium text-gray-500"><span className="text-[#428E5F] font-bold">Tarik Gambar ke sini atau</span> Unggah</p>
                              <p className="text-[11px] text-gray-400 mt-1 uppercase">Ukuran gambar maksimum adalah 2 MB.</p>
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 italic">Hanya mendukung file .jpg dan .png</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* --- TAMPILAN PESAN ERROR DIBAWAH --- */}
              {submitError && (
                  <div className="px-8 pb-0 animate-in slide-in-from-top-2 fade-in">
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span className="font-medium">{submitError}</span>
                    </div>
                  </div>
              )}

              {/* Navigation Footer */}
              <div className="p-8 border-t border-gray-50 flex justify-end items-center gap-8 bg-gray-50/50">
                {step > 1 && <button onClick={prevStep} className="text-[#428E5F] font-bold text-sm hover:underline cursor-pointer">Kembali</button>}
                <button 
                  onClick={step === (isPrestasi ? 5 : 4) ? handleSubmit : nextStep}
                  disabled={!isStepValid() || isSubmitting || isCheckingNisn}
                  className={`px-10 py-3 font-bold rounded-lg transition-all active:scale-95 shadow-md flex items-center gap-2 ${isStepValid() && !isCheckingNisn ? 'bg-[#428E5F] text-white hover:bg-[#36754e] cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  {isSubmitting ? (
                    <>Memproses... <Loader2 className="animate-spin" size={18}/></>
                  ) : isCheckingNisn ? (
                    <>Mengecek NISN... <Loader2 className="animate-spin" size={18}/></>
                  ) : step === (isPrestasi ? 5 : 4) ? (
                    "Simpan & Kirim"
                  ) : (
                    "Selanjutnya"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// --- HELPER COMPONENTS ---

function DatePickerGroup({ label, value, onChange, placeholder }: any) {
  const dateValue = value ? new Date(value) : undefined;
  return (
    <div className="space-y-2 flex flex-col text-left">
      <label className="text-[13px] font-bold text-gray-700">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal py-6 rounded-lg border-gray-200 hover:bg-gray-50", !value && "text-muted-foreground")}>
            {value ? format(new Date(value), "PPP", { locale: id }) : <span className="text-gray-400">{placeholder}</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dateValue} onSelect={onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus locale={id} captionLayout="dropdown" fromYear={1960} toYear={2030} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function InputReadOnly({ label, value }: any) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-[13px] font-bold text-gray-700 uppercase tracking-tight">{label}</label>
      <input type="text" value={value} disabled className="w-full px-4 py-3 rounded-lg border border-gray-50 bg-gray-50 text-gray-500 text-sm font-medium" />
    </div>
  );
}

// Tambahkan prop isError untuk menampilkan border merah jika error
function InputGroup({ label, name, value, onChange, placeholder, type = "text", maxLength, isError }: any) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-[13px] font-bold text-gray-700">{label}</label>
      <input 
        type={type} 
        name={name} 
        value={value} 
        onChange={onChange} 
        maxLength={maxLength} 
        placeholder={placeholder} 
        className={`w-full px-4 py-3 rounded-lg border outline-none text-sm transition-focus focus:border-[#428E5F] ${isError ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-gray-200'}`} 
      />
    </div>
  );
}

function SelectGroup({ label, name, value, onChange, options }: any) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-[13px] font-bold text-gray-700">{label}</label>
      <div className="relative">
        <select name={name} value={value} onChange={onChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none text-sm bg-white appearance-none cursor-pointer">
          <option value="">Pilih</option>{options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
      </div>
    </div>
  );
}

function RadioGroup({ label, name, selected, onChange, options }: any) {
  return (
    <div className="space-y-4 text-left">
      <label className="text-[13px] font-bold text-gray-700 block">{label}</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {options.map((opt: string) => (
          <label key={opt} className="flex items-center gap-3 cursor-pointer group">
            <input type="radio" name={name} value={opt} checked={selected === opt} onChange={onChange} className="sr-only" />
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected === opt ? 'border-[#428E5F] bg-green-50' : 'border-gray-200 group-hover:border-gray-300'}`}>
              {selected === opt && <div className="w-2.5 h-2.5 bg-[#428E5F] rounded-full" />}
            </div>
            <span className={`text-[13px] ${selected === opt ? 'text-[#428E5F] font-bold' : 'text-gray-600'}`}>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function StepItem({ number, title, active, completed }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all ${active ? 'border-[#428E5F] text-[#428E5F] bg-green-50 shadow-sm' : completed ? 'bg-[#428E5F] border-[#428E5F] text-white shadow-md' : 'border-gray-100 text-gray-300'}`}>
        {completed ? <Check size={20} strokeWidth={3} /> : number}
      </div>
      <span className={`font-bold text-[14px] ${active ? 'text-[#428E5F]' : completed ? 'text-gray-700' : 'text-gray-300'}`}>{title}</span>
    </div>
  );
}

function ContactInfo({ icon, text }: any) {
  return (
    <div className="flex items-start gap-3 text-gray-500 group"><div className="text-[#428E5F] mt-1 shrink-0 group-hover:scale-110 transition-transform">{icon}</div><p className="text-[12px] leading-relaxed">{text}</p></div>
  );
}