import React from 'react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans text-[#333333] bg-white">
      
      {/* --- NAVBAR --- */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b lg:px-24">
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10">
            <Image 
              src="/logo.png" 
              alt="Logo Persis Kudang" 
              fill 
              className="object-contain"
            />
          </div>
          {/* Warna Hijau Custom: #0A8F47 */}
          <span className="font-bold text-[#0A8F47] tracking-tight uppercase">PERSIS KUDANG 212</span>
        </div>
        <div className="hidden space-x-8 text-sm font-semibold md:flex">
          <a href="#" className="text-[#0A8F47]">Beranda</a>
          <a href="#" className="text-[#333333] hover:text-[#0A8F47]">Daftar</a>
          <a href="#" className="text-[#333333] hover:text-[#0A8F47]">Hubungi Kami</a>
        </div>
        <button className="px-6 py-4 text-sm font-bold text-white transition-all rounded-md bg-[#0A8F47] hover:bg-[#087a3c]">
          Login Admin
        </button>
      </nav>

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

      {/* --- FOOTER --- */}
      <footer className="px-8 py-20 bg-[#F0F9F4] lg:px-24 border-t border-green-100">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="relative w-10 h-10">
                <Image src="/logo.png" alt="Logo Footer" fill className="object-contain" />
              </div>
              <span className="font-black text-[#0A8F47] text-lg uppercase tracking-tight">PERSIS KUDANG 212</span>
            </div>
            <p className="max-w-md text-base leading-relaxed text-[#555555] font-medium">
              Pesantren Persis 212 Kudang merupakan lembaga pendidikan Islam berbasis pesantren di Kabupaten Garut yang mengintegrasikan pendidikan agama dan umum, serta aktif dalam dakwah dan kegiatan sosial.
            </p>
          </div>
          
          <div>
            <h4 className="mb-8 font-black text-[#333333] text-xl">Kontak</h4>
            <ul className="space-y-5 text-base text-[#555555] font-medium">
              <li className="flex items-center gap-4">
                <span className="text-xl">📧</span> persiskudang@gmail.com
              </li>
              <li className="flex items-center gap-4">
                <span className="text-xl">📞</span> +62 811-2222-3333
              </li>
              <li className="flex items-center gap-4 leading-relaxed">
                <span className="text-xl">📍</span> Jl. Kudang 1, Wanajaya, Kec. Wanaraja, Kabupaten Garut, Jawa Barat 44183
              </li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-between pt-12 mt-20 border-t border-green-200 md:flex-row">
          <p className="text-sm text-[#888888] font-bold uppercase tracking-widest">@ 2025 Point Studio. All rights reserved</p>
          <div className="flex gap-4 mt-6 md:mt-0">
            <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0A8F47] text-white hover:scale-110 transition-transform">f</a>
            <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0A8F47] text-white hover:scale-110 transition-transform">ig</a>
            <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0A8F47] text-white hover:scale-110 transition-transform">yt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}