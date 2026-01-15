"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ChevronLeft, Upload, Copy, Info, Check, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

// Helper Rupiah
const formatRupiah = (val: number) => new Intl.NumberFormat("id-ID").format(val);

// INFO REKENING (Dari ENV)
const BANK_INFO = {
  nama: process.env.NEXT_PUBLIC_BANK_NAME || "Mandiri",
  norek: process.env.NEXT_PUBLIC_ACCOUNT_NUMBER || "1310044442988",
  atas_nama: process.env.NEXT_PUBLIC_ACCOUNT_HOLDER || "Een Purucut"
};

export default function BayarPage() {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<any>(null);
  
  // State Form
  const [metode, setMetode] = useState("Transfer");
  const [nominalBayar, setNominalBayar] = useState("");
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false); 
  
  // --- STATE BARU: Untuk menyimpan pesan error ---
  const [errorMessage, setErrorMessage] = useState(""); 

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("itemsToPay");
    if (!raw) {
      router.push("/client/user/cek-tagihan");
    } else {
      const parsed = JSON.parse(raw);
      setSessionData(parsed);
      setNominalBayar(parsed.total.toString());
    }
  }, [router]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBuktiFile(e.target.files[0]);
      setErrorMessage(""); // Reset error saat user memilih file baru
    }
  };

  const isFormValid = () => {
    if (!nominalBayar || parseInt(nominalBayar) <= 0) return false;
    if (metode === 'Transfer') {
        if (!buktiFile) return false;
    }
    return true;
  };

 // ... (Bagian import dan state tetap sama)

const handleSubmit = async () => {
    setErrorMessage(""); 

    if (!isFormValid()) return;

    setLoading(true);
    const formData = new FormData();
    
    // --- PERBAIKAN LOGIC PEMBAGIAN NOMINAL CICILAN ---
    const inputUser = parseInt(nominalBayar);
    
    // Jika user bayar cicilan (misal 50rb), kita update nominal di tiap itemnya
    // Untuk case sederhana (1 item terpilih), nominal_bayar item tersebut diisi inputUser
    const updatedItems = sessionData.items.map((item: any) => ({
        ...item,
        nominal_bayar: inputUser.toString() // Gunakan hasil ketikan user, bukan data session
    }));

    formData.append("id_siswa", sessionData.siswa.id);
    formData.append("metode", metode.toLowerCase());
    formData.append("bank", BANK_INFO.nama);
    formData.append("pengirim", sessionData.siswa.nama); 
    formData.append("items", JSON.stringify(updatedItems)); // Kirim items yang sudah diupdate nominalnya
    
    if (buktiFile && metode === 'Transfer') {
        formData.append("bukti", buktiFile);
    }

    try {
      const response = await axios.post("/server/api/user/bayar-tagihan", formData);
      
      if (response.data.error) {
         setErrorMessage(response.data.error);
      } else {
         router.push("/client/user/success");
      }
    } catch (error: any) {
      const pesan = error.response?.data?.error || "Terjadi kesalahan sistem";
      setErrorMessage(pesan); 
    } finally {
      setLoading(false);
    }
};

// ... (Sisa kodingan UI tetap sama)

  if (!sessionData) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#333] relative text-left">
      
      {showCopyToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] bg-gray-800 text-white px-4 py-2 rounded-lg text-sm shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check size={16} className="text-[#428E5F]" /> Berhasil menyalin ke papan klip
        </div>
      )}

      <Navbar />

      <main className="max-w-[800px] mx-auto px-4 md:px-6 py-10">
        
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#428E5F] mb-6 font-bold text-sm hover:underline transition-colors w-fit">
            <ChevronLeft size={18} /> Kembali ke Tagihan
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Konfirmasi Pembayaran</h2>
            </div>

            <div className="p-8">
                
                <div className="space-y-6 animate-in fade-in duration-300 text-left">
                    
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-gray-700">Metode Pembayaran</label>
                      <div className="relative">
                        <select 
                          value={metode} 
                          onChange={(e) => {
                              setMetode(e.target.value);
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

                    {metode === "Transfer" && (
                      <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                        <InputReadOnly label="Bank" value={BANK_INFO.nama} />
                        <div className="space-y-2">
                           <label className="text-[13px] font-bold text-gray-700">Nomor Rekening</label>
                           <div className="relative">
                              <input type="text" value={BANK_INFO.norek} disabled className="w-full px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 text-gray-600 text-sm font-medium" />
                              <button type="button" onClick={() => handleCopy(BANK_INFO.norek)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-md text-[#428E5F]"><Copy size={16} /></button>
                           </div>
                        </div>
                        <InputReadOnly label="Atas Nama" value={BANK_INFO.atas_nama} />
                      </div>
                    )}
                
                    <div className="space-y-5">
                      <InputReadOnly label="Total Tagihan Terpilih" value={`IDR ${formatRupiah(sessionData.total)}`} />
                      
                      <div className="space-y-2 text-left">
                        <label className="text-[13px] font-bold text-gray-700">Jumlah yang akan dibayar</label>
                        <input 
                            type="number" 
                            value={nominalBayar} 
                            onChange={(e) => setNominalBayar(e.target.value)} 
                            placeholder={`Contoh: ${sessionData.total}`} 
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none text-sm transition-focus focus:border-[#428E5F]" 
                        />
                      </div>
                      
                      {metode === "Cash" && (
                        <div className="p-5 bg-green-50 rounded-xl border border-green-100 flex gap-4 animate-in zoom-in duration-300">
                          <div className="w-10 h-10 bg-[#428E5F] rounded-full flex items-center justify-center shrink-0"><Info className="text-white" size={20} /></div>
                          <div>
                            <p className="font-bold text-[#428E5F] text-sm">Pembayaran Tunai (Cash)</p>
                            <p className="text-xs text-gray-600 mt-1">Selesaikan proses ini, lalu lakukan pembayaran tunai di loket sekolah (Tata Usaha) untuk konfirmasi.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {metode === "Transfer" && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <label className="text-[13px] font-bold text-gray-700">Bukti Pembayaran</label>
                        <div 
                          onClick={() => fileInputRef.current?.click()} 
                          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group
                            ${errorMessage ? 'border-red-300 bg-red-50/10' : 'border-gray-200 bg-white hover:border-[#428E5F]'}
                          `}
                        >
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                          {buktiFile ? (
                            <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-lg">
                              <Check size={18} className="text-[#428E5F]" /><span className="text-sm font-bold text-gray-700">{buktiFile.name}</span>
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

            </div>

            {/* --- ERROR MESSAGE DISPLAY --- */}
            {errorMessage && (
                <div className="px-8 pb-0 animate-in slide-in-from-top-2 fade-in">
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span className="font-medium">{errorMessage}</span>
                    </div>
                </div>
            )}

            <div className="p-8 border-t border-gray-50 flex justify-end items-center gap-8 bg-gray-50/50">
                <button 
                  onClick={handleSubmit}
                  disabled={!isFormValid() || loading}
                  className={`px-10 py-3 font-bold rounded-lg transition-all active:scale-95 shadow-md flex items-center gap-2 ${isFormValid() && !loading ? 'bg-[#428E5F] text-white hover:bg-[#36754e] cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  {loading ? (
                    <>Memproses... <Loader2 className="animate-spin" size={18}/></>
                  ) : (
                    "Kirim Pembayaran"
                  )}
                </button>
            </div>

        </div>

      </main>
      
      <Footer />
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