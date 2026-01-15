"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, AlertCircle } from "lucide-react"; 
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

export default function CekTagihanPage() {
  const [nisn, setNisn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // State untuk pesan error
  const router = useRouter();

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error sebelum request baru
    setError(""); 
    
    if (!nisn) return;

    setLoading(true);
    try {
      const res = await axios.post("/server/api/user/cek-tagihan", { nisn });
      
      // Jika sukses, simpan data & redirect
      sessionStorage.setItem("dataTagihanSiswa", JSON.stringify(res.data));
      router.push("/client/user/cek-tagihan/result");
      
    } catch (err: any) {
      // --- PERUBAHAN DISINI ---
      // Menggunakan pesan custom sesuai request jika API error (misal 404)
      const errorMessage = "Data NISN tidak ditemukan, silahkan lakukan pendaftaran terlebih dahulu";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8F9FA]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-32 relative">
        
        {/* Dekorasi Background */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-green-50/50 to-transparent pointer-events-none" />

        <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl border border-gray-100 p-10 z-10 animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Cek Tagihan</h1>
            <p className="text-gray-500 text-sm">
              Lihat rincian tagihan pendaftaran atau daftar ulang berdasarkan data pendaftar.
            </p>
          </div>

          <form onSubmit={handleCheck} className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-sm font-bold text-gray-700 block uppercase pl-1">
                NISN
              </label>
              <div className="relative maxlength-[10]">
                <input
                  value={nisn}
                  onChange={(e) => {
                    setNisn(e.target.value.replace(/[^0-9]/g, '')); // Hanya angka
                    setError(""); // Hilangkan error saat mengetik
                    
                  }}
                  placeholder="Masukkan NISN anda"
                  maxLength={10}
                  className={`w-full px-4 py-3 rounded-lg border outline-none transition-all text-sm font-medium 
                    ${error 
                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50 bg-red-50/10" 
                        : "border-gray-200 focus:border-[#428E5F] focus:ring-4 focus:ring-green-50"
                    }
                  `}
                />
              </div>
            </div>

            {/* --- PESAN ERROR MERAH --- */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-xs font-medium flex items-start gap-3 animate-in slide-in-from-top-1">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !nisn}
              className="w-full bg-[#428E5F] hover:bg-[#36754e] text-white font-bold py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Mencari Data...
                </>
              ) : (
                "Cek Tagihan"
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}