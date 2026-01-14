"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ClipboardList, UserCheck, ReceiptText, Menu, X } from 'lucide-react';

const Navbar = () => {
  const pathname = usePathname();
  // State untuk Dropdown Desktop
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // State untuk Menu Mobile (Hamburger)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // State untuk Accordion Daftar di Mobile
  const [isMobileDaftarOpen, setIsMobileDaftarOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown desktop jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tutup mobile menu & dropdown jika pindah halaman
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/client/user/landingPage') return true;
    return pathname === path;
  };

  const isDaftarActive = [
    '/client/user/persyaratanPPDB', 
    '/client/user/form-pendaftaran',
    '/client/user/daftar-ulang', 
    '/client/user/cek-tagihan',
    '/client/user/success',
  ].some(path => pathname.includes(path));

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 px-6 md:px-8 lg:px-24 py-4 font-sans">
        <div className="flex items-center justify-between relative">
          
          {/* ======================= */}
          {/* 1. KIRI:  LOGO     */}
          {/* ======================= */}
          <Link href="/client/user/landingPage" className="flex items-center gap-3 z-20">
            <div className="relative w-10 h-10">
              <Image 
                src="/logopersis.png" 
                alt="Logo Persis Kudang" 
                fill 
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#0A8F47]  tracking-widest">PPDB</span>
                <span className="font-bold text-[#0A8F47] text-[12px] ">MA PERSIS KUDANG</span>
              </div>
          </Link>

          {/* ======================= */}
          {/* 2. TENGAH: MENU LINK    */}
          {/* (Absolute Center)       */}
          {/* ======================= */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" ref={dropdownRef}>
            <Link 
              href="/client/user/landingPage" 
              className={`text-sm font-semibold transition-all duration-300 ${
                isActive('/') ? 'text-[#0A8F47]' : 'text-[#333333] hover:text-[#0A8F47]'
              }`}
            >
              Beranda
            </Link>

            {/* Dropdown Daftar Desktop */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-1 text-sm font-semibold transition-colors cursor-pointer outline-none ${
                  isDropdownOpen || isDaftarActive ? 'text-[#0A8F47]' : 'text-[#333333] hover:text-[#0A8F47]'
                }`}
              >
                Daftar <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop Dropdown Card */}
              {isDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-6 w-[340px] bg-white rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                  <DropdownItem 
                    icon={<ClipboardList size={20} className="text-amber-500" />}
                    bgIcon="bg-amber-50"
                    title="Pendaftaran PPDB"
                    desc="Formulir pendaftaran siswa baru."
                    href="/client/user/persyaratanPPDB"
                    active={pathname === '/client/user/persyaratanPPDB'}
                  />
                  <DropdownItem 
                    icon={<UserCheck size={20} className="text-red-500" />}
                    bgIcon="bg-red-50"
                    title="Pendaftaran Ulang PPDB"
                    desc="Lengkapi data untuk daftar ulang."
                    href="/client/user/daftar-ulang"
                    active={pathname === '/client/user/daftar-ulang'}
                  />
                  <DropdownItem 
                    icon={<ReceiptText size={20} className="text-green-500" />}
                    bgIcon="bg-green-50"
                    title="Cek Tagihan"
                    desc="Lihat status rincian biaya."
                    href="/client/user/cek-tagihan"
                    active={pathname === '/client/user/cek-tagihan'}
                  />
                </div>
              )}
            </div>

          </div>

          {/* ======================= */}
          {/* 3. KANAN: LOGIN BUTTON  */}
          {/* ======================= */}
          <div className="hidden md:block z-20">
            <Link href="/client/auth/login">
              <button className="px-6 py-2.5 bg-[#0A8F47] text-white text-sm font-bold rounded-[8px] hover:bg-[#087a3c] transition-all shadow-sm active:scale-95 cursor-pointer">
                Login Admin
              </button>
            </Link>
          </div>

          {/* ======================= */}
          {/* 4. MOBILE: HAMBURGER    */}
          {/* ======================= */}
          <div className="md:hidden z-20">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-[#333] p-1 active:scale-90 transition-transform"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* MOBILE OVERLAY MENU (Slide in)                            */}
      {/* ========================================================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-right duration-300 font-sans md:hidden">
          
          {/* Header Mobile Menu */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Link href="/client/user/landingPage" className="flex items-center gap-3 z-20">
            <div className="relative w-10 h-10">
              <Image 
                src="/logopersis.png" 
                alt="Logo Persis Kudang" 
                fill 
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#0A8F47]  tracking-widest">PPDB</span>
                <span className="font-bold text-[#0A8F47] text-[12px] ">MA PERSIS KUDANG</span>
              </div>
          </Link>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 p-1 hover:bg-gray-100 rounded-full">
              <X size={24} />
            </button>
          </div>

          {/* Links Mobile */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2">
            <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Menu Utama</p>
            
            <Link 
              href="/client/user/landingPage"
              className={`block py-3 text-base font-semibold text-gray-500 border-b border-gray-50 ${
                isActive('/') ? 'text-[#0A8F47]' : 'text-[#333333] hover:text-[#0A8F47]'
              }`}
            >
              Beranda
            </Link>

            {/* Accordion Daftar (Khusus Mobile) */}
            <div className="border-b border-gray-50 py-2">
              <button 
                onClick={() => setIsMobileDaftarOpen(!isMobileDaftarOpen)}
                className="flex items-center justify-between w-full py-2 text-base font-semibold text-gray-500"
              >
                <span>Daftar</span>
                <ChevronDown size={16} className={`transition-transform ${isMobileDaftarOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* DROPDOWN ITEM MOBILE (UI SAMA DENGAN DESKTOP) */}
              {isMobileDaftarOpen && (
                <div className="mt-3 space-y-3 pl-1 animate-in slide-in-from-top-2 fade-in">
                  <DropdownItem 
                    icon={<ClipboardList size={20} className="text-amber-500" />}
                    bgIcon="bg-amber-50"
                    title="Pendaftaran PPDB"
                    desc="Formulir pendaftaran baru."
                    href="/client/user/persyaratanPPDB"
                    active={pathname === '/client/user/persyaratanPPDB'}
                  />
                  <DropdownItem 
                    icon={<UserCheck size={20} className="text-red-500" />}
                    bgIcon="bg-red-50"
                    title="Pendaftaran Ulang"
                    desc="Untuk siswa yang diterima."
                    href="/client/user/daftar-ulang"
                    active={pathname === '/client/user/daftar-ulang'}
                  />
                  <DropdownItem 
                    icon={<ReceiptText size={20} className="text-green-500" />}
                    bgIcon="bg-green-50"
                    title="Cek Tagihan"
                    desc="Cek status pembayaran."
                    href="/client/user/cek-tagihan"
                    active={pathname === '/client/user/cek-tagihan'}
                  />
                </div>
              )}
            </div>

          
            <div className="pt-8">
              <Link href="/client/auth/login">
                <button className="w-full py-3.5 bg-[#0A8F47] text-white font-bold rounded-xl shadow-lg shadow-green-100 active:scale-95 transition-transform">
                  Login Admin
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Sub-komponen Dropdown Item (Dipakai di Desktop & Mobile agar UI Konsisten)
function DropdownItem({ icon, bgIcon, title, desc, href, active, onClick }: any) {
  return (
    <Link 
      href={href} 
      onClick={onClick} 
      className={`flex items-start gap-4 p-3 md:px-6 md:py-4 rounded-xl transition-colors group ${active ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
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