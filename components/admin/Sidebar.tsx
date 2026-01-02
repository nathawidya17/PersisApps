"use client";
import React from 'react';
import { LayoutDashboard, Users, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/client/admin/dashboard' },
  { icon: Users, label: 'Daftar Siswa', href: '/client/admin/DaftarSiswa' },
  { icon: GraduationCap, label: 'PPDB', href: '/client/admin/PPDB' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#068A50] text-white min-h-screen flex flex-col fixed left-0 top-0 shadow-xl z-50">
      {/* Logo & Branding */}
      <div className="p-8 flex items-center gap-3">
        <div className="relative w-12 h-12 flex-shrink-0 rounded-xl p-1">
          <Image 
            src="/logopersis.png" 
            alt="Logo Persis" 
            fill  
            className="object-contain p-1"
            priority
          />
        </div>
        <div>
          <h1 className="text-[13px] font-bold leading-tight tracking-tight text-white uppercase">
            PPDB 
          </h1>
          <h1 className="text-[13px] font-bold leading-tight tracking-tight text-white uppercase">
            PERSIS KUDANG 
          </h1>
        </div>
      </div>

      {/* Navigasi Menu */}
      <nav className="mt-8 flex-1 pl-4 space-y-2">
        {menuItems.map((item) => {
          // Logic isActive: support sub-route (misal: /siswa/[id] tetap aktif di menu Daftar Siswa)
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-4 transition-all duration-300 group ${
                isActive 
                  ? 'bg-gray-50 text-[#068A50] font-bold rounded-l-[10px] shadow-sm' 
                  : 'hover:bg-white/10 text-white/80 hover:text-white rounded-l-[10px]'
              }`}
            >
              <item.icon 
                size={20} 
                className={`${isActive ? 'text-[#068A50]' : 'text-white/70 group-hover:text-white'} transition-colors`} 
              />
              <span className="text-[14px] tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Sidebar (Optional) */}
      <div className="p-6 border-t border-white/10">
        <p className="text-[10px] text-white/40 text-center uppercase tracking-widest">
          © 2026 Persis 212 Kudang
        </p>
      </div>
    </aside>
  );
}