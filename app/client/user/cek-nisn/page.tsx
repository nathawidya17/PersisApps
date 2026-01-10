"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/user/Navbar';
import Footer from '@/components/user/Footer';
import { Loader2, AlertCircle } from 'lucide-react';

export default function DaftarUlangPage() {
  const router = useRouter();
  const [nisn, setNisn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch('/server/api/user/cek-nisn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nisn }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Gagal mencari data");
      }

      // Logic sukses (Alert sementara)
      alert(`Data ditemukan atas nama: ${result.data.nama_lengkap}.`);
      
      // router.push(`/client/user/tagihan?nisn=${nisn}`); 

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8F9FA]">
      <Navbar />
      
      {/* UPDATE: Ditambahkan 'py-24' agar ada jarak atas bawah yang luas */}
      <main className="flex-grow flex items-center justify-center px-4 py-50 relative">
        
        {/* Dekorasi Background Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-green-50/50 to-transparent pointer-events-none" />

        <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl border border-gray-100 p-10 z-10 animate-in fade-in zoom-in duration-300">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Daftar Ulang</h1>
            <p className="text-gray-500 text-sm">
              Gunakan NISN untuk melanjutkan proses pendaftaran ulang.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-2 text-left">
              <label htmlFor="nisn" className="text-sm font-bold text-gray-700 block">
                NISN
              </label>
              <input
                id="nisn"
                type="text"
                value={nisn}
                onChange={(e) => setNisn(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Masukkan NISN anda"
                maxLength={10}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#428E5F] focus:ring-4 focus:ring-green-50 outline-none transition-all text-sm font-medium"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
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
                "Cari Data"
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}