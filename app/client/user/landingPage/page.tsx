"use client"; 
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; 
import Footer from '@/components/user/Footer';
import Navbar from '@/components/user/Navbar';

export default function LandingPage() {
  const router = useRouter(); 

  return (
    <div className="min-h-screen font-sans text-[#333333] bg-white flex flex-col">
      
      <Navbar/>

      {/* HERO SECTION*/}
      <section className="relative w-full min-h-[620px] lg:min-h-[764px] flex flex-col lg:flex-row items-center bg-white overflow-hidden mb-0 lg:mb-12">
        
        {/* BACKGROUND */}
        <div className="absolute inset-0 w-full h-full z-0">
          <div className="relative w-full h-full">
            <Image 
              src="/background.png" 
              alt="Gedung MA Persis" 
              fill 
              className="object-cover object-[43%_center]" 
              priority
            />
          </div>
        </div>

        <div className="container mx-auto px-6 lg:px-24 relative z-20 flex flex-col lg:flex-row items-center justify-between h-full pt-10 lg:pt-0">
          
          {/* 1. TEXT CONTENT */}
          <div className="w-full lg:w-1/2 py-8 lg:py-20 text-center lg:text-left flex flex-col items-center lg:items-start">
            <h1 className="text-[32px] md:text-5xl font-black leading-[1.2] text-[#0A8F47] lg:text-[72px] tracking-tight ">
              MA Persis Kudang
            </h1>
            <p className="mt-4 lg:mt-6 text-[14px] md:text-[18px] leading-relaxed text-[#4A4A4A] max-w-[320px] lg:max-w-lg font-medium">
              Lingkungan pendidikan Islami yang membentuk peserta didik berilmu, beriman, dan berakhlakul karimah sebagai bekal masa depan.
            </p>
            
            <div className="flex items-center gap-4 mt-6 lg:mt-10">
              <button 
                onClick={() => router.push('/client/user/persyaratanPPDB')}
                className="px-6 py-3 lg:px-8 lg:py-3.5 font-bold text-white rounded-md bg-[#0A8F47] shadow-lg hover:shadow-xl transition-all text-[13px] lg:text-base cursor-pointer"
              >
                Daftar Sekarang
              </button>
            </div>
          </div>
          
          {/* 2. MODEL IMAGE (Siswa) */}
          <div className="relative w-full lg:w-1/2 flex justify-center items-end mt-4 lg:mt-0 h-[390px] lg:h-[764px]">
            <div className="relative w-[260px] h-full lg:w-[120%]">
              <Image 
                src="/heromodel.png" 
                alt="Siswa MA Persis" 
                fill 
                className="object-contain object-bottom z-30 drop-shadow-xl"
                priority
              />
            </div>
          </div>

        </div>
      </section>
      
      {/* PROFIL SEKOLAH (GREEN CARD)*/}
      <section className="px-4 lg:px-10 relative z-10 -mt-6 lg:mt-0 mt-10">
        
        {/* GREEN CARD CONTAINER */}
        <div className="bg-[#0A8F47] rounded-[20px] lg:rounded-[32px] p-6 lg:p-16 text-white flex flex-col lg:flex-row gap-8 lg:gap-16 items-start overflow-hidden relative shadow-[0_10px_40px_-10px_rgba(10,143,71,0.5)]">
          
          {/* Pattern Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20 lg:opacity-100">
             <Image src="/Container.png" alt="Pattern" fill className="object-cover" />
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 items-start relative z-10 w-full">
            
            {/* Bagian Kiri: Judul */}
            <div className="w-full lg:w-[50%] relative z-10 font-sans text-left">
                <span className="text-[13px] lg:text-[20px] font-medium block mb-2 lg:mb-4 tracking-wide text-white/80">
                    Profil Sekolah
                </span>

                <h2 className="leading-[1.15] flex flex-col items-start">
                    <span className="relative inline-block text-[28px] lg:text-[56px] font-bold text-white">
                        Komitmen Kami
                        {/* Garis Kuning */}
                        <span className="absolute left-0 bottom-1 lg:-bottom-2 w-full h-[3px] lg:h-[6px] bg-[#FFD600] rounded-full"></span>
                    </span>

                    <span className="text-[28px] lg:text-[56px] font-bold block text-white mt-1 lg:mt-4">
                        dalam
                    </span>
                    <span className="text-[28px] lg:text-[56px] font-bold block text-white">
                        Memajukan
                    </span>
                    <span className="text-[28px] lg:text-[56px] font-bold block text-white">
                        Pendidikan Islam
                    </span>
                </h2>
            </div>

            {/* Bagian Kanan: Deskripsi */}
            <div className="w-full lg:w-[50%] text-[12px] lg:text-[16px] leading-[1.8] font-normal relative z-10 space-y-4 lg:space-y-6 text-justify text-white/90">
                <p>
                Pesantren Persis 212 Kudang merupakan lembaga pendidikan Islam berbasis pesantren 
                yang berlokasi di Desa Wanajaya, Kecamatan Wanaraja, Kabupaten Garut, Jawa Barat. 
                Pesantren ini mengintegrasikan pendidikan agama Islam dengan pendidikan umum serta 
                aktif dalam kegiatan dakwah, sosial, dan kemanusiaan.
                </p>
                <p>
                Seiring perkembangannya, Pesantren Persis 212 Kudang terus meningkatkan fasilitas, 
                sarana pendidikan, dan pemanfaatan teknologi informasi, serta dikenal sebagai lembaga 
                yang konsisten menjaga nilai-nilai keislaman sekaligus adaptif terhadap perkembangan zaman.
                </p>
            </div>
          </div>
        </div>

        {/* STATS OVERLAY (FLOATING CARD) */}
        <div className="max-w-5xl mx-auto -mt-10 lg:-mt-14 relative z-30 px-2 lg:px-4">
          <div className="bg-white rounded-[16px] lg:rounded-2xl shadow-xl flex flex-row divide-x divide-gray-100 py-4 lg:py-0">
            {[
              { label: 'Siswa Aktif', val: '150', icon: '👥', color: '#0A8F47' },
              { label: 'Pengajar', val: '25', icon: '🏫', color: '#D32F2F' },
              { label: 'Penghargaan', val: '100', icon: '🏆', color: '#F9A825' },
            ].map((stat, i) => (
              <div key={i} className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-5 px-1 lg:p-8 text-center lg:text-left">
                {/* Icon Kecil di Mobile */}
                <div className="text-xl lg:text-5xl flex-shrink-0 mb-1 lg:mb-0">{stat.icon}</div>
                <div>
                  {/* Angka Besar */}
                  <div className="text-[16px] lg:text-5xl font-extrabold leading-none" style={{ color: stat.color }}>
                    {stat.val}<span className="text-[12px] lg:text-4xl text-black/40 lg:text-inherit">+</span>
                  </div>
                  {/* Label Kecil */}
                  <div className="text-[9px] lg:text-sm text-gray-400 font-medium mt-1 uppercase tracking-wider scale-90 lg:scale-100">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BROSUR PPDB SECTION */}
      <section className="px-0 py-4 lg:py-20 text-center bg-white">
        <div className="px-6 mb-2 lg:mb-8">
          <h2 className="text-[26px] lg:text-5xl font-black text-[#333333] mb-0.5">
            Brosur PPDB
          </h2>
          <p className="max-w-2xl mx-auto text-[#777777] font-medium text-[12px] lg:text-base leading-tight">
            Profil madrasah dan informasi pendaftaran.
          </p>
        </div>

        {/* CONTAINER BROSUR - MENGGUNAKAN ASPECT RATIO AGAR TIDAK ADA SPOT PUTIH */}
        <div className="w-full mx-auto relative flex justify-center mt-2">
          <div className="relative w-[95%] md:w-full lg:max-w-6xl aspect-[4/3] md:aspect-[16/9] lg:h-[1000px]">
            <Image
              src="/brosurr.png"
              alt="Brosur PPDB MA Persis Kudang"
              fill
              className="object-contain"
              priority 
            />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}