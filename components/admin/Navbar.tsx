"use client";

import React, { useState, useEffect } from 'react';
import { Bell, LogOut, ChevronDown, User, Settings } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [adminName, setAdminName] = useState("Loading...");
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  // Ambil data profil saat navbar dimuat
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Buat API route /api/auth/me untuk mengambil data admin yang sedang login
        const response = await axios.get('/server/api/auth/me');
        setAdminName(response.data.nama);
      } catch (error) {
        setAdminName("Admin");
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      // Panggil API logout untuk menghapus cookie
      await axios.post('/server/api/auth/logout');
      // Redirect ke halaman login
      window.location.href = "/client/user/landingPage";
    } catch (error) {
      console.error("Logout gagal", error);
    }
  };

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-end px-8 sticky top-0 z-10 ml-64">
      <div className="flex items-center gap-6">
  

        {/* Profil Admin & Logout Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 pl-6 border-l border-gray-100 hover:opacity-80 transition-all"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-800">{adminName}</p>
              <p className="text-xs text-gray-400">Operator PPDB</p>
            </div>
            <div className="w-10 h-10 bg-[#068A50] rounded-full flex items-center justify-center text-white font-bold shadow-sm">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-5 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in zoom-in duration-200">
              <div className="px-4 py-2 border-b border-gray-50 md:hidden">
                <p className="text-sm font-bold text-gray-800">{adminName}</p>
              </div>
             
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
              >
                <LogOut size={16} /> Keluar Sistem
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}