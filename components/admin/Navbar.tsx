"use client";
import React from 'react';
import { Bell, User } from 'lucide-react';

export default function Navbar() {
  return (
  <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-end px-8 sticky top-0 z-10 ml-64">
  {/* Teks Dashboard dihapus, justify-between diganti justify-end agar elemen langsung rapat ke kanan */}
  <div className="flex items-center gap-6">
    {/* Notifikasi */}
    <button className="relative text-gray-400 hover:text-gray-600">
      <Bell size={22} />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full text-[10px] text-white flex items-center justify-center font-medium">
        3
      </span>
    </button>

    {/* Profil Admin */}
    <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
      <div className="text-right">
        <p className="text-sm font-bold text-gray-800">Admin PPDB</p>
        <p className="text-xs text-gray-400">Operator</p>
      </div>
      <div className="w-10 h-10 bg-[#068A50] rounded-full flex items-center justify-center text-white font-bold">
        A
      </div>
    </div>
  </div>
</header>
  );
}