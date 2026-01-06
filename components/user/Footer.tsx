"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Menutup dropdown jika klik di luar area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pastikan path di sini sesuai dengan struktur folder/route kamu
  const menuItems = [
    {
      title: "Pendaftaran PPDB",
      path: "/client/user/persyaratanPPDB",
      desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
      iconBg: "bg-[#FFF4D9]",
    },
    {
      title: "Pendaftaran Ulang PPDB",
      path: "/client/daftar-ulang",
      desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
      iconBg: "bg-[#FFE9E9]",
    },
    {
      title: "Cek Tagihan",
      path: "/client/cek-tagihan",
      desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
      iconBg: "bg-[#E9F9EE]",
    },
  ];

  // Fungsi Helper untuk Active State
  const getLinkStyle = (path: string) => {
    const isActive = pathname === path;
    return isActive 
      ? "text-[#068A50] font-bold opacity-100" // Warna Hijau Aktif
      : "text-[#333333] opacity-40 hover:opacity-100 hover:text-[#068A50]"; // Pudar jika tidak aktif
  };

  // Cek apakah ada item dropdown yang sedang aktif
  const isDropdownActive = menuItems.some(item => pathname === item.path);

  return (
    <nav className="relative z-50 flex items-center justify-between px-8 py-5 bg-white border-b lg:px-24">
      {/* Logo Section */}
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
        <span className="font-bold text-[#0A8F47] tracking-tight uppercase">
          PERSIS KUDANG 212
        </span>
      </div>

      {/* Menu Navigasi Tengah */}
      <div className="hidden space-x-8 text-sm font-semibold md:flex items-center">
        
        {/* BERANDA - Disesuaikan dengan URL di browser kamu */}
        <Link 
          href="/client/landingPage" 
          className={`${getLinkStyle("/client/landingPage")} transition-all duration-200`}
        >
          Beranda
        </Link>
        
        {/* DROPDOWN DAFTAR */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1 transition-all duration-200 ${
              isDropdownActive || isOpen 
              ? 'text-[#068A50] opacity-100' 
              : 'text-[#333333] opacity-40 hover:opacity-100'
            }`}
          >
            Daftar
            <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Modal Dropdown */}
          {isOpen && (
            <div 
              className="absolute left-1/2 -translate-x-1/2 mt-8 bg-white shadow-[0px_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 z-[999] rounded-lg p-4"
              style={{ width: '320px' }}
            >
              <div className="flex flex-col gap-4">
                {menuItems.map((item, index) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link 
                      key={index} 
                      href={item.path} 
                      onClick={() => setIsOpen(false)}
                      className={`flex items-start gap-4 p-3 rounded-lg transition-all hover:bg-gray-50 ${isActive ? 'bg-[#F9FFF9]' : ''}`}
                    >
                      <div className={`flex-none w-12 h-12 rounded-full flex items-center justify-center ${item.iconBg}`}>
                        <span className="text-xl">📋</span>
                      </div>
                      <div className="flex flex-col">
                        <h4 className={`font-bold text-[15px] leading-tight ${isActive ? 'text-[#068A50]' : 'text-[#333333]'}`}>
                          {item.title}
                        </h4>
                        <p className="text-[12px] text-[#999999] font-normal leading-[18px] mt-1">
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* HUBUNGI KAMI */}
        <Link 
          href="/client/kontak" 
          className={`${getLinkStyle("/client/kontak")} transition-all duration-200`}
        >
          Hubungi Kami
        </Link>
      </div>

      {/* Button Admin */}
      <button className="px-6 py-3 text-sm font-bold text-white rounded-md bg-[#0A8F47] hover:bg-[#068A50] transition-colors">
        Login Admin
      </button>
    </nav>
  );
}