import React from 'react';
import Image from 'next/image';
import Footer from '@/components/user/Footer';
import Navbar from '@/components/user/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans text-[#333333] bg-white">
      
      {/* --- NAVBAR --- */}
     <Navbar/>

      {/* --- HERO SECTION --- */}
      <section className="relative w-full min-h-[600px] flex items-center bg-white overflow-hidden">
        
        {/* LAYER 1: BACKGROUND FULL */}
        <div className="absolute inset-0 w-full h-full z-0">
          <div className="relative w-full h-full">
            <Image 
              src="/background.png" 
              alt="Gedung MA Persis" 
              fill 
              className="object-cover object-center"
              priority
            />
            {/* Gradient Overlay diperhalus sesuai contoh */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          </div>
        </div>

        <div className="container mx-auto px-8 lg:px-24 relative z-20 flex flex-col lg:flex-row items-center justify-between">
          
          {/* TEXT CONTENT (Sisi Kiri) */}
          <div className="w-full lg:w-1/2 py-20">
            {/* Judul menggunakan font-black (900) untuk ketebalan maksimal */}
            <h1 className="text-5xl font-black leading-tight text-[#0A8F47] lg:text-[72px] tracking-tight">
              MA Persis Kudang
            </h1>
            <p className="mt-6 text-[18px] leading-relaxed text-[#4A4A4A] max-w-lg font-medium">
              Lingkungan pendidikan Islami yang membentuk peserta didik berilmu, beriman, dan berakhlakul karimah sebagai bekal masa depan.
            </p>
            <div className="flex items-center gap-6 mt-10">
              <button className="px-8 py-3.5 font-bold text-white rounded-md bg-[#0A8F47] shadow-lg hover:shadow-xl transition-all">
                Daftar Sekarang
              </button>
              {/* Warna Emas Custom: #B38B40 */}
              <button className="font-bold text-[#B38B40] hover:underline decoration-2 underline-offset-4">
                Hubungi Kami
              </button>
            </div>
          </div>
          
          {/* LAYER 2: MODEL (Sisi Kanan - Cowo di kanan dengan Mirroring) */}
          <div className="relative w-full lg:w-1/2 h-[450px] md:h-[600px] lg:h-[700px] flex items-end justify-center lg:justify-end">
            <div className="relative w-[120%] h-full">
              <Image 
                src="/model.png" 
                alt="Siswa MA Persis" 
                fill 
                className="object-contain object-bottom z-30 -scale-x-100"
                priority
              />
            </div>
          </div>

        </div>
      </section>

      {/* --- PROFIL SEKOLAH (Green Card) --- */}
<section className="px-20 lg:px-10 relative z-2 mt-20">
  <div className="bg-[#0A8F47] rounded-[32px] p-10 lg:p-16 text-white flex flex-col lg:flex-row gap-10 lg:gap-16 items-start overflow-hidden relative shadow-xl">
    
    {/* Foto Background Pattern */}
    <div className="absolute inset-0 pointer-events-none opacity-30">
       <Image 
        src="/modal.png" 
        alt="Pattern Background" 
        fill 
        className="object-cover"
        priority
       />
    </div>

    <div className="w-full lg:w-[45%] relative z-10">
      <h2 className="leading-tight">
        <span className="text-sm font-normal block mb-4 tracking-wide">Profil Sekolah</span>
        <span className="text-4xl lg:text-[48px] font-bold block leading-[1.15]">Komitmen Kami</span>
        <span className="text-4xl lg:text-[48px] font-bold block leading-[1.15]">dalam Memajukan</span>
        <span className="text-4xl lg:text-[48px] font-bold block leading-[1.15]">Pendidikan Islam</span>
      </h2>
    </div>

    <div className="w-full lg:w-[55%] text-[15px] lg:text-[16px] leading-relaxed font-normal relative z-10 space-y-4">
      <p>Pesantren Persis 212 Kudang merupakan lembaga pendidikan Islam berbasis pesantren yang berlokasi di Desa Wanajaya, Kecamatan Wanaraja, Kabupaten Garut, Jawa Barat. Pesantren ini mengintegrasikan pendidikan agama Islam dengan pendidikan umum serta aktif dalam kegiatan dakwah, sosial, dan kemanusiaan.</p>
      <p>Seiring perkembangannya, Pesantren Persis 212 Kudang terus meningkatkan fasilitas, sarana pendidikan, dan pemanfaatan teknologi informasi, serta dikenal sebagai lembaga yang konsisten menjaga nilai-nilai keislaman sekaligus adaptif terhadap perkembangan zaman.</p>
    </div>
  </div>

  {/* --- STATS OVERLAY (Card menyatu dengan divider) --- */}
  <div className="max-w-5xl mx-auto -mt-14 relative z-30 px-4">
    <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200">
      {[
        { label: 'Siswa Aktif', val: '150', icon: '👥', color: '#0A8F47' },
        { label: 'Pengajar', val: '25', icon: '🏫', color: '#D32F2F' },
        { label: 'Penghargaan', val: '100', icon: '🏆', color: '#F9A825' },
      ].map((stat, i) => (
        <div key={i} className="flex-1 p-8 flex items-center justify-center gap-5">
          <div className="text-5xl flex-shrink-0">{stat.icon}</div>
          <div className="text-center md:text-left">
            <div className="text-5xl font-extrabold" style={{ color: stat.color }}>
              {stat.val}<span className="text-4xl">+</span>
            </div>
            <div className="text-sm text-gray-500 font-medium mt-1">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* --- BROSUR PPDB SECTION --- */}
      <section className="px-8 py-24 text-center lg:px-24 bg-white">
        <h2 className="text-4xl font-black text-[#333333] lg:text-5xl">Brosur PPDB</h2>
        <p className="max-w-2xl mx-auto mt-6 text-[#777777] font-medium text-base">
          Brosur resmi yang memuat informasi singkat mengenai profil madrasah, program pendidikan, fasilitas, serta penerimaan peserta didik baru.
        </p>
        
        <div className="mt-16 max-w-6xl mx-auto relative h-[600px] md:h-[900px] shadow-2xl rounded-3xl overflow-hidden">
           <Image 
            src="/brosur.png" 
            alt="Brosur PPDB MA Persis Kudang" 
            fill 
            className="object-contain bg-[#f9f9f9]"
           />
        </div>
      </section>

     <Footer />
    </div>
  );
}