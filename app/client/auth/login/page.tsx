"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react'; 
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/server/api/auth/login', { email, password });
      if (response.status === 200) {
        // Gunakan window.location agar refresh state auth secara total
        window.location.href = '/client/admin/dashboard'; 
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      alert(err.response?.data?.error || "Akses ditolak. Periksa kembali Email & Password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 font-sans selection:bg-[#428E5F] selection:text-white">
      {/* Ornamen Latar Belakang agar lebih profesional */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-[#428E5F]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-[#428E5F]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-[450px] z-10">
        {/* Logo / Badge */}
        <div className="bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-gray-800 tracking-tight mb-2">
                Selamat <span className="text-[#428E5F]">Datang</span>
              </h1>
              <p className="text-gray-400 text-sm font-medium uppercase tracking-[0.2em]">
                Portal Admin PPDB Persis 212
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Input Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">Email Admin</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="text-gray-300 group-focus-within:text-[#428E5F] transition-colors" size={20} />
                  </div>
                  <input 
                    type="email" 
                    required
                    placeholder="Email"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none transition-all focus:bg-white focus:border-[#428E5F] focus:ring-4 focus:ring-[#428E5F]/5 text-gray-700"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Input Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="text-gray-300 group-focus-within:text-[#428E5F] transition-colors" size={20} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none transition-all focus:bg-white focus:border-[#428E5F] focus:ring-4 focus:ring-[#428E5F]/5 text-gray-700"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-300 hover:text-[#428E5F] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Tombol Login */}
              <div className="pt-4">
                <button 
                  disabled={loading}
                  className="w-full bg-[#428E5F] text-white font-bold py-4 rounded-2xl hover:bg-[#36754e] active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:cursor-not-allowed shadow-xl shadow-[#428E5F]/20 flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Login
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-gray-50/80 p-6 text-center border-t border-gray-100">
             <p className="text-gray-400 text-xs">
               &copy; 2026 PPDB Pesantren Persis 212 Kudang. <br/> Hak Cipta Dilindungi.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}