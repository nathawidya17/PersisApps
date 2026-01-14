"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/user/Navbar';
import Footer from '@/components/user/Footer';
import { Mail, Phone, MapPin, Check, Copy, Upload, ChevronDown, Plus, Trash2, Info, CalendarIcon, X, Loader2, AlertCircle } from 'lucide-react';

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

// KONFIGURASI BANK
const PAYMENT_CONFIG = {
  bank: process.env.NEXT_PUBLIC_BANK_NAME || "Mandiri",
  accountNumber: process.env.NEXT_PUBLIC_ACCOUNT_NUMBER || "1310044442988",
  accountHolder: process.env.NEXT_PUBLIC_ACCOUNT_HOLDER || "Een Purucut",
};

// --- KOMPONEN KONTEN UTAMA (LOGIC LAMA ADA DISINI) ---
function FormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nisnParam = searchParams.get('nisn');

  const [step, setStep] = useState(1);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Transfer");
  const [showCopyToast, setShowCopyToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- STATE ERROR BARU ---
  const [errorMessage, setErrorMessage] = useState("");

  // STATE DATA
  const [formData, setFormData] = useState<any>({
    nama_lengkap: "", nisn: "", jenis_kelamin: "", tempat_lahir: "", tanggal_lahir: "", no_hp: "", alamat_rumah: "",
    asal_sekolah: "", alamat_sekolah: "", tahun_lulus: "", kode_pos_sekolah: "",
    nama_ayah: "", tempat_lahir_ayah: "", tanggal_lahir_ayah: "", pendidikan_ayah: "", pekerjaan_ayah: "", penghasilan_ayah: "",
    nama_ibu: "", tempat_lahir_ibu: "", tanggal_lahir_ibu: "", pendidikan_ibu: "", pekerjaan_ibu: "", penghasilan_ibu: "",
    no_hp_orang_tua: "",
    jumlah_dibayar: "",
    bukti_pembayaran: null
  });

  // STATE TAGIHAN (Multi-select)
  const [availableBills, setAvailableBills] = useState<any[]>([]); 
  const [selectedBillIds, setSelectedBillIds] = useState<number[]>([]); 

  // --- 1. FETCH DATA BY NISN ---
  useEffect(() => {
    if (!nisnParam) {
      router.push('/client/user/daftar-ulang'); 
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('/server/api/user/daftar-ulang/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nisn: nisnParam }),
        });
        
        const result = await res.json();
        
        if (!res.ok) {
           // Untuk fetch data awal bolehlah pakai alert/redirect karena fatal
           alert(result.error || "Data tidak ditemukan");
           router.push('/client/user/daftar-ulang'); 
           return;
        }

        setFormData((prev: any) => ({
            ...prev,
            ...result.student,
            bukti_pembayaran: null 
        }));

        // FILTER TAGIHAN
        const rawBills = result.paymentTypes || [];
        const filteredBills = rawBills.filter((bill: any) => {
            const name = (bill.nama_pembayaran || "").toLowerCase(); 
            return !name.includes('pendaftaran'); 
        });

        setAvailableBills(filteredBills);

      } catch (error) {
        console.error(error);
        alert("Gagal memuat data.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [nisnParam, router]);

  // --- 2. LOGIC SCROLL & HELPER ---
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const nextStep = () => { setStep(step + 1); scrollToTop(); };
  const prevStep = () => { setStep(step - 1); scrollToTop(); };

  const handleCheckboxChange = (id: any) => {
    const numericId = Number(id);
    if (!numericId) return;

    setSelectedBillIds(prev => 
      prev.includes(numericId) ? prev.filter(item => item !== numericId) : [...prev, numericId]
    );
  };

  const removeTag = (id: number) => {
    setSelectedBillIds(prev => prev.filter(item => item !== id));
  };

  const totalTagihan = selectedBillIds.reduce((total, id) => {
    const item = availableBills.find(bill => bill.id_jenis_pembayaran === id);
    const harga = item?.nominal || 0; 
    return total + Number(harga);
  }, 0);

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev:any) => ({ ...prev, bukti_pembayaran: e.target.files![0] }));
      setErrorMessage(""); // Reset error saat ganti file
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev:any) => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value.replace(/[^0-9]/g, '') }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      const formatted = format(date, "yyyy-MM-dd");
      setFormData((prev:any) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev:any) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(""); // Reset error

    if (selectedBillIds.length === 0) {
        setErrorMessage("Mohon pilih minimal satu tagihan.");
        return;
    }
    // Cek file di frontend juga untuk feedback instan
    if (paymentMethod === "Transfer" && !formData.bukti_pembayaran) {
        setErrorMessage("Mohon unggah bukti pembayaran.");
        return;
    }

    setIsSubmitting(true);
    
    try {
        const submitData = new FormData();
        submitData.append("nisn", formData.nisn);
        submitData.append("metode_pembayaran", paymentMethod);
        submitData.append("tagihan_ids", JSON.stringify(selectedBillIds));
        
        if (formData.bukti_pembayaran) {
            submitData.append("bukti_pembayaran", formData.bukti_pembayaran);
        }

        const res = await fetch('/server/api/user/daftar-ulang/submit', {
            method: 'POST',
            body: submitData,
        });

        const result = await res.json();

        // --- CEK ERROR DARI BACKEND ---
        if (result.error) {
            setErrorMessage(result.error); // Tampilkan pesan merah (misal: "Hanya file gambar...")
        } else if (res.ok) {
            router.push('/client/user/success'); 
        } else {
            setErrorMessage("Terjadi kesalahan saat memproses data.");
        }

    } catch (error) {
        setErrorMessage("Gagal terhubung ke server.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-[#428E5F]" size={40} />
                <p className="text-gray-500 font-medium">Memuat data siswa...</p>
            </div>
        </div>
    );
  }

  const getStepTitle = () => {
    if (step === 1) return "Data Siswa";
    if (step === 2) return "Data Sekolah Sebelumnya";
    if (step === 3) return "Data Orang Tua";
    return "Konfirmasi Pembayaran";
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#333333] relative text-left">
      {showCopyToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] bg-gray-800 text-white px-4 py-2 rounded-lg text-sm shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check size={16} className="text-[#428E5F]" /> Berhasil menyalin ke papan klip
        </div>
      )}

      <Navbar />
      <main className="max-w-[1250px] mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Alur */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 border-b border-gray-50 pb-4">Form Daftar Ulang</h2>
              <div className="space-y-6 mt-6">
                <StepItem number={1} title="Data Siswa" active={step === 1} completed={step > 1} />
                <StepItem number={2} title="Data Sekolah Sebelumnya" active={step === 2} completed={step > 2} />
                <StepItem number={3} title="Data Orang Tua" active={step === 3} completed={step > 3} />
                <StepItem number={4} title="Konfirmasi Pembayaran" active={step === 4} completed={step > 4} />
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
                <h2 className="text-xl font-bold text-gray-800">{getStepTitle()}</h2>
              </div>

              <div className="p-8 flex-grow">
                
                {/* STEP 1: DATA SISWA */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-700 text-sm mb-4">
                        <Info className="shrink-0 mt-0.5" size={18} />
                        <p>Data Ini diperoleh saat anda melakukan pendaftaran. Silakan ubah jika ada kesalahan.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Nama Siswa" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} />
                        <SelectGroup label="Jenis Kelamin" name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} options={["Laki-laki", "Perempuan"]} />
                        <InputGroup label="Tempat Lahir" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} />
                        
                        <DatePickerGroup 
                          label="Tanggal Lahir" 
                          name="tanggal_lahir" 
                          value={formData.tanggal_lahir} 
                          onChange={(date: Date | undefined) => handleDateChange("tanggal_lahir", date)} 
                          placeholder="Pilih Tanggal Lahir"
                        />
                        
                        <InputGroup label="No HP (WA)" name="no_hp" value={formData.no_hp} onChange={handleNumberChange} />
                        <div className="md:col-span-2"><InputGroup label="Alamat Lengkap" name="alamat_rumah" value={formData.alamat_rumah} onChange={handleChange} /></div>
                    </div>
                  </div>
                )}

                {/* STEP 2: DATA SEKOLAH SEBELUMNYA */}
                {step === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                    <InputGroup label="NISN" name="nisn" value={formData.nisn} readOnly={true} placeholder="10 Digit NISN" />
                    <InputGroup label="Nama Sekolah Asal" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleChange} placeholder="SMP/MTs Asal" />
                    <div className="md:col-span-2"><InputGroup label="Alamat Sekolah" name="alamat_sekolah" value={formData.alamat_sekolah} onChange={handleChange} placeholder="Alamat lengkap sekolah asal" /></div>
                    <InputGroup label="Tahun Lulus" name="tahun_lulus" value={formData.tahun_lulus} onChange={handleNumberChange} placeholder="Contoh: 2025" maxLength={4} />
                    <InputGroup label="Kode Pos Sekolah" name="kode_pos_sekolah" value={formData.kode_pos_sekolah} onChange={handleNumberChange} placeholder="xxxxx" maxLength={5}/>
                  </div>
                )}

                {/* STEP 3: DATA ORANG TUA */}
                {step === 3 && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* DATA AYAH */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputGroup label="Nama Ayah" name="nama_ayah" value={formData.nama_ayah} onChange={handleChange} placeholder="Ayah" />
                      <InputGroup label="Tempat Lahir" name="tempat_lahir_ayah" value={formData.tempat_lahir_ayah} onChange={handleChange} placeholder="Contoh: Garut" />
                      
                      <DatePickerGroup 
                        label="Tanggal Lahir" 
                        name="tanggal_lahir_ayah" 
                        value={formData.tanggal_lahir_ayah} 
                        onChange={(date: Date | undefined) => handleDateChange("tanggal_lahir_ayah", date)} 
                        placeholder="Pilih Tanggal Lahir"
                      />

                      <InputGroup label="Pekerjaan" name="pekerjaan_ayah" value={formData.pekerjaan_ayah} onChange={handleChange} placeholder="PNS" />
                      <SelectGroup label="Pendidikan" name="pendidikan_ayah" value={formData.pendidikan_ayah} onChange={handleChange} options={["SD", "SMP", "SMA", "S1","S2","S3"]} />
                    </div>
                    <RadioGroup label="Penghasilan Ayah" name="penghasilan_ayah" selected={formData.penghasilan_ayah} onChange={handleChange} options={["Kurang Dari 1 Juta", "1-3 Juta", "3-5 Juta", "Lebih Dari 5 Juta"]} />
                    
                    <hr />
                    
                    {/* DATA IBU */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputGroup label="Nama Ibu" name="nama_ibu" value={formData.nama_ibu} onChange={handleChange} placeholder="Ibu" />
                      <InputGroup label="Tempat Lahir" name="tempat_lahir_ibu" value={formData.tempat_lahir_ibu} onChange={handleChange} placeholder="Contoh: Garut" />
                      
                      <DatePickerGroup 
                        label="Tanggal Lahir" 
                        name="tanggal_lahir_ibu" 
                        value={formData.tanggal_lahir_ibu} 
                        onChange={(date: Date | undefined) => handleDateChange("tanggal_lahir_ibu", date)} 
                        placeholder="Pilih Tanggal Lahir"
                      />

                      <InputGroup label="Pekerjaan" name="pekerjaan_ibu" value={formData.pekerjaan_ibu} onChange={handleChange} placeholder="PNS" />
                      <SelectGroup label="Pendidikan" name="pendidikan_ibu" value={formData.pendidikan_ibu} onChange={handleChange} options={["SD", "SMP", "SMA", "S1","S2","S3"]} />
                    </div>
                    <RadioGroup label="Penghasilan Ibu" name="penghasilan_ibu" selected={formData.penghasilan_ibu} onChange={handleChange} options={["Kurang Dari 1 Juta", "1-3 Juta", "3-5 Juta", "Lebih Dari 5 Juta"]} />
                    
                    <InputGroup label="No Hp Orang Tua" name="no_hp_orang_tua" value={formData.no_hp_orang_tua} onChange={handleNumberChange} placeholder="08xxxxxxxx" maxLength={14} />
                    <hr />
                  </div>
                )}

                {/* STEP 4: TAGIHAN & PEMBAYARAN */}
                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-300 text-left">
                    
                    {/* Pilih Tagihan */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-[13px] font-bold text-gray-700">Pilih Tagihan</label>
                            <span className="text-xs text-gray-400 font-medium">*Minimal pilih 1</span>
                        </div>
                        
                        {/* TAGS TERPILIH */}
                        {selectedBillIds.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedBillIds.map(id => {
                                    const bill = availableBills.find(b => b.id_jenis_pembayaran === id);
                                    if (!bill) return null;
                                    return (
                                        <div key={id} className="bg-green-50 border border-green-100 text-[#428E5F] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-in zoom-in duration-200">
                                            {bill?.nama_pembayaran}
                                            <button onClick={() => removeTag(id)} className="hover:bg-green-200 rounded-full p-0.5 transition-colors"><X size={12}/></button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* LIST TAGIHAN */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                            {availableBills.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">Tidak ada tagihan tersedia saat ini.</div>
                            ) : (
                                availableBills.map((bill, index) => {
                                    const nama = bill.nama_pembayaran || "Tagihan"; 
                                    const harga = bill.nominal || 0;
                                    const billId = bill.id_jenis_pembayaran; 
                                    const uniqueKey = billId ? `bill-${billId}` : `bill-idx-${index}`;
                                    const isSelected = billId ? selectedBillIds.includes(billId) : false;

                                    return (
                                        <div 
                                            key={uniqueKey} 
                                            onClick={() => billId && handleCheckboxChange(billId)}
                                            className={`flex items-center justify-between p-4 cursor-pointer border-b border-gray-50 last:border-0 transition-all hover:bg-gray-50 ${isSelected ? 'bg-green-50/30' : ''}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-[#428E5F] border-[#428E5F]' : 'border-gray-300 bg-white'}`}>
                                                    {isSelected && <Check size={14} className="text-white" />}
                                                </div>
                                                <span className={`text-sm ${isSelected ? 'font-bold text-[#428E5F]' : 'font-medium text-gray-600'}`}>{nama}</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{formatRupiah(harga)}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-gray-700">Metode Pembayaran</label>
                      <div className="relative">
                        <select 
                          value={paymentMethod} 
                          onChange={(e) => {
                              setPaymentMethod(e.target.value);
                              setErrorMessage(""); // Reset error saat ganti metode
                          }} 
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
                      <InputReadOnly label="Total Tagihan Terpilih" value={formatRupiah(totalTagihan)} />
                      <InputGroup 
                        label="Jumlah yang akan dibayar" 
                        name="jumlah_dibayar" 
                        value={formData.jumlah_dibayar} 
                        onChange={handleNumberChange} 
                        placeholder={`Contoh: ${formatRupiah(totalTagihan)}`} 
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
                            ${errorMessage ? 'border-red-300 bg-red-50/10' : 'border-gray-200 bg-white hover:border-[#428E5F]'}
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

              {/* --- PESAN ERROR DITAMPILKAN DISINI --- */}
              {errorMessage && (
                  <div className="px-8 pb-0 animate-in slide-in-from-top-2 fade-in">
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span className="font-medium">{errorMessage}</span>
                    </div>
                  </div>
              )}

              {/* Navigation Footer */}
              <div className="p-8 border-t border-gray-50 flex justify-end items-center gap-8 bg-gray-50/50">
                {step > 1 && <button onClick={prevStep} className="text-[#428E5F] font-bold text-sm hover:underline cursor-pointer">Kembali</button>}
                <button 
                  onClick={step === 4 ? handleSubmit : nextStep}
                  disabled={isSubmitting || (step === 4 && selectedBillIds.length === 0)}
                  className={`px-10 py-3 font-bold rounded-lg transition-all active:scale-95 shadow-md flex items-center gap-2 ${isSubmitting || (step===4 && selectedBillIds.length===0) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#428E5F] text-white hover:bg-[#36754e] cursor-pointer'}`}
                >
                  {isSubmitting ? "Memproses..." : step === 4 ? "Simpan & Kirim" : "Selanjutnya"}
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

// --- PEMBUNGKUS UTAMA DENGAN SUSPENSE UNTUK MENGHINDARI ERROR BUILD NEXT.JS ---
export default function FormDaftarUlang() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
          <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-[#428E5F]" size={40} />
              <p className="text-gray-500 font-medium">Memuat halaman...</p>
          </div>
      </div>
    }>
      <FormContent />
    </Suspense>
  );
}

// --- KOMPONEN HELPER ---
function DatePickerGroup({ label, value, onChange, placeholder }: any) {
    const dateValue = value ? new Date(value) : undefined;
    return (
      <div className="space-y-2 flex flex-col text-left">
        <label className="text-[13px] font-bold text-gray-700">{label}</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full px-4 py-3 h-auto text-left font-normal rounded-lg border-gray-200 hover:bg-gray-50 shadow-none",
                !value && "text-muted-foreground"
              )}
            >
              {value ? format(new Date(value), "PPP", { locale: id }) : <span className="text-gray-400 text-sm">{placeholder}</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={onChange}
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
              initialFocus
              locale={id}
              captionLayout="dropdown" 
              fromYear={1960}
              toYear={2030}
            />
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
  
  function InputGroup({ label, name, value, onChange, placeholder, type = "text", maxLength, readOnly = false }: any) {
    return (
      <div className="space-y-2 text-left">
        <label className="text-[13px] font-bold text-gray-700">{label}</label>
        <input 
          type={type} 
          name={name} 
          value={value || ""} 
          onChange={onChange} 
          maxLength={maxLength} 
          readOnly={readOnly}
          placeholder={placeholder} 
          className={`w-full px-4 py-3 rounded-lg border outline-none text-sm transition-focus ${readOnly ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-200 focus:border-[#428E5F]'}`} 
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