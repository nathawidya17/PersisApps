"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null); 

    if (!email.includes("@")) {
        setError("Format email tidak valid. Harap sertakan '@'.");
        setLoading(false);
        return;
    }

    try {
      const response = await axios.post('/server/api/auth/login', { email, password });
      
      if (response.status === 200) {
        window.location.href = '/client/admin/dashboard'; 
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      const errorMessage = err.response?.data?.error || "Terjadi kesalahan sistem.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#428E5F] selection:text-white relative overflow-hidden">
      
      {/* --- BACKGROUND ORNAMENTS (Responsive Size) --- */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute top-[-5%] right-[-10%] w-64 h-64 md:w-96 md:h-96 bg-[#428E5F]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-5%] left-[-10%] w-64 h-64 md:w-96 md:h-96 bg-[#428E5F]/5 rounded-full blur-3xl"></div>
      </div>

      {/* --- TOMBOL KEMBALI (Posisi Aman Mobile) --- */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-start">
        <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-500 hover:text-[#428E5F] transition-all font-bold text-xs bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-full shadow-sm border border-gray-200 hover:shadow-md active:scale-95"
        >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Beranda</span>
        </Link>
      </div>

      {/* --- LOGIN CARD --- */}
      <div className="w-full max-w-[420px] z-10 mt-12 md:mt-0">
        <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-500">
          
          {/* Card Body: Padding lebih kecil di Mobile (p-6) vs Desktop (p-10) */}
          <div className="p-6 md:p-10 lg:p-12">
            
            <div className="text-center mb-8 md:mb-10">
              <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight mb-2">
                Selamat <span className="text-[#428E5F]">Datang</span>
              </h1>
              <p className="text-gray-400 text-[10px] md:text-sm font-medium uppercase tracking-[0.2em] leading-relaxed">
                Portal Admin PPDB Persis 212
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 md:space-y-6" noValidate>
              
              {/* Input Email */}
              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">Email Admin</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="text-gray-300 group-focus-within:text-[#428E5F] transition-colors" size={18} />
                  </div>
                  <input 
                    type="email" 
                    required
                    placeholder="Email"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none transition-all focus:bg-white focus:border-[#428E5F] focus:ring-4 focus:ring-[#428E5F]/5 text-gray-700 text-sm font-medium placeholder-gray-400"
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                    }}
                  />
                </div>
              </div>

              {/* Input Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="text-gray-300 group-focus-within:text-[#428E5F] transition-colors" size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl outline-none transition-all focus:bg-white focus:border-[#428E5F] focus:ring-4 focus:ring-[#428E5F]/5 text-gray-700 text-sm font-medium placeholder-gray-400"
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null); 
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-300 hover:text-[#428E5F] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* ERROR MESSAGE BOX */}
              {error && (
                <div className="flex items-start gap-3 p-3 md:p-4 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                    <div className="flex-1">
                        <h4 className="text-[10px] md:text-xs font-bold text-red-600 uppercase mb-0.5">Login Gagal</h4>
                        <p className="text-[11px] md:text-xs text-red-500 font-medium leading-relaxed">{error}</p>
                    </div>
                </div>
              )}

              {/* Tombol Login */}
              <div className="pt-2">
                <button 
                  disabled={loading}
                  className="w-full bg-[#428E5F] text-white font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl hover:bg-[#36754e] active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:cursor-not-allowed shadow-lg shadow-[#428E5F]/20 flex items-center justify-center gap-3 cursor-pointer text-sm md:text-base"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Login Masuk"
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-gray-50/80 p-5 md:p-6 text-center border-t border-gray-100">
             <p className="text-gray-400 text-[10px] md:text-xs leading-relaxed">
               &copy; 2026 PPDB Pesantren Persis 212 Kudang. <br className="hidden md:block"/> Hak Cipta Dilindungi.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}