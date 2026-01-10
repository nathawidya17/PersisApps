"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ClipboardList, UserCheck, ReceiptText } from 'lucide-react';

const Navbar = () => {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Menutup dropdown jika mengklik di luar area navbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/client/user/landingPage') return true;
    return pathname === path;
  };

  const isDaftarActive = [
    '/client/user/persyaratanPPDB', 
    '/client/user/form-pendaftaran',
    '/client/user/cek-nisn', 
    '/client/user/cek-tagihan',
    '/client/user/success',

  ].some(path => pathname.includes(path));

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 px-8 lg:px-24 py-4 flex items-center justify-between font-sans">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <Image 
            src="/logopersis.png" 
            alt="Logo Persis Kudang" 
            fill 
            className="object-contain"
          />
        </div>
        <span className="font-bold text-[#0A8F47] text-[13px] tracking-tight uppercase">
          PERSIS KUDANG 212
        </span>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-10" ref={dropdownRef}>
        {/* Beranda Link */}
        <Link 
          href="/client/user/landingPage" 
          className={`text-sm font-semibold transition-all duration-300 ${
            isActive('/') ? 'text-[#0A8F47]' : 'text-[#333333] hover:text-[#0A8F47]'
          }`}
        >
          Beranda
        </Link>

        {/* Dropdown Daftar (Muncul saat Klik) */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-1 text-sm font-semibold transition-colors cursor-pointer outline-none ${
              isDropdownOpen || isDaftarActive ? 'text-[#0A8F47]' : 'text-[#333333] hover:text-[#0A8F47]'
            }`}
          >
            Daftar <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Card Dropdown - Desain menyamai card di Figma */}
          {isDropdownOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-5 w-[340px] bg-white rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
              <DropdownItem 
                icon={<ClipboardList size={20} className="text-amber-500" />}
                bgIcon="bg-amber-50"
                title="Pendaftaran PPDB"
                desc="Formulir pendaftaran siswa baru tahap awal."
                href="/client/user/persyaratanPPDB"
                active={pathname === '/client/user/persyaratanPPDB'}
                onClick={() => setIsDropdownOpen(false)}
              />
              <DropdownItem 
                icon={<UserCheck size={20} className="text-red-500" />}
                bgIcon="bg-red-50"
                title="Pendaftaran Ulang PPDB"
                desc="Lengkapi data untuk daftar ulang siswa."
                href="/client/user/cek-nisn"
                active={pathname === '/client/user/cek-nisn'}
                onClick={() => setIsDropdownOpen(false)}
              />
              <DropdownItem 
                icon={<ReceiptText size={20} className="text-green-500" />}
                bgIcon="bg-green-50"
                title="Cek Tagihan"
                desc="Lihat status rincian biaya pendaftaran."
                href="/client/user/cek-tagihan"
                active={pathname === '/client/user/cek-tagihan'}
                onClick={() => setIsDropdownOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Hubungi Kami Link */}
        <Link 
          href="/client/user/hubungi-kami" 
          className={`text-sm font-semibold transition-all duration-300 ${
            pathname === '/client/user/hubungi-kami' ? 'text-[#0A8F47]' : 'text-[#333333] hover:text-[#0A8F47]'
          }`}
        >
          Hubungi Kami
        </Link>
      </div>

      {/* Login Admin Button */}
      <Link href="/client/auth/login">
        <button className="px-6 py-2.5 bg-[#0A8F47] text-white text-sm font-bold rounded-[8px] hover:bg-[#087a3c] transition-all shadow-sm active:scale-95 cursor-pointer">
          Login Admin
        </button>
      </Link>
    </nav>
  );
};

// Sub-komponen Dropdown Item
function DropdownItem({ icon, bgIcon, title, desc, href, active, onClick }: any) {
  return (
    <Link 
      href={href} 
      onClick={onClick} 
      className={`flex items-start gap-4 px-6 py-4 transition-colors group ${active ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}
    >
      <div className={`w-11 h-11 ${bgIcon} rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className={`text-[13px] font-bold leading-none mb-1.5 transition-colors ${active ? 'text-[#0A8F47]' : 'text-gray-800 group-hover:text-[#0A8F47]'}`}>
          {title}
        </p>
        <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
          {desc}
        </p>
      </div>
    </Link>
  );
}

export default Navbar;