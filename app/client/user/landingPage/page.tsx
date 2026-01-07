import React from 'react';
import Image from 'next/image';
import Footer from '@/components/user/Footer';
import Navbar from '@/components/user/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans text-[#333333] bg-white flex flex-col">
      
      {/* --- NAVBAR --- */}
      <Navbar/>

      {/* --- HERO SECTION --- */}
      {/* Perubahan: min-h-[calc(100vh-80px)] untuk mengisi sisa layar setelah navbar */}
      <section className="relative w-full min-h-[calc(100vh-67px)] flex items-center bg-white overflow-hidden mb-12">
        
        {/* LAYER 1: BACKGROUND FULL */}
        <div className="absolute inset-0 w-full h-full z-0">
          <div className="relative w-full h-full">
            <Image 
              src="/background.png" 
              alt="Gedung MA Persis" 
              fill 
              className="object-cover object-center lg:object-[center_30%]" // Menyesuaikan fokus gedung
              priority
            />
            {/* Gradient Overlay diperhalus untuk menyatu ke putih di sisi kiri */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent z-10" />
            
            {/* Tambahan: Gradient ke bawah agar transisi ke section profil lebih halus (menghilangkan spot putih) */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20 z-10" />
          </div>
        </div>

        <div className="container mx-auto px-8 lg:px-24 relative z-20 flex flex-col lg:flex-row items-center justify-between h-full">
          
          {/* TEXT CONTENT (Sisi Kiri) */}
          <div className="w-full lg:w-1/2 py-12 lg:py-20">
            <h1 className="text-5xl font-black leading-tight text-[#0A8F47] lg:text-[72px] tracking-tight">
              MA Persis Kudang
            </h1>
            <p className="mt-6 text-[18px] leading-relaxed text-[#4A4A4A] max-w-lg font-medium">
              Lingkungan pendidikan Islami yang membentuk peserta didik berilmu, beriman, dan berakhlakul karimah sebagai bekal masa depan.
            </p>
            <div className="flex flex-wrap items-center gap-6 mt-10">
              <button className="px-8 py-3.5 font-bold text-white rounded-md bg-[#0A8F47] shadow-lg hover:shadow-xl transition-all">
                Daftar Sekarang
              </button>
              <button className="font-bold text-[#B38B40] hover:underline decoration-2 underline-offset-4">
                Hubungi Kami
              </button>
            </div>
          </div>
          
          {/* LAYER 2: MODEL (Sisi Kanan) */}
          {/* Perubahan: Menggunakan flex-1 dan h-full agar menyesuaikan tinggi layar secara dinamis */}
          <div className="relative w-full lg:w-1/2 self-end h-[500px] md:h-[600px] lg:h-[calc(100vh-68px)] flex items-end justify-center lg:justify-end">
            <div className="relative w-full h-[90%] lg:h-full lg:w-[110%]">
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
      {/* Tambahan: mt-0 atau sedikit negatif jika ingin merapat ke hero agar tidak ada celah */}
      <section className="px-4 md:px-20 lg:px-10 relative z-2 mt-12 lg:mt-0">
        <div className="bg-[#0A8F47] rounded-[32px] p-8 lg:p-16 text-white flex flex-col lg:flex-row gap-10 lg:gap-16 items-start overflow-hidden relative shadow-xl">
          <div className="absolute inset-0 pointer-events-none ">
             <Image 
              src="/Container.png" 
              alt="Pattern Background" 
              fill 
              className="object-cover"
             />
          </div>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start relative z-10">
  {/* Bagian Kiri: Judul & Subtitle */}
  <div className="w-full lg:w-[50%] relative z-10 font-sans">
    <h2 className="leading-[1.1]">
      {/* Label Profil Sekolah */}
      <span className="text-lg lg:text-[20px] font-medium block mb-4 tracking-wide text-white/90">
        Profil Sekolah
      </span>

      {/* Teks Utama Bertumpuk */}
      <span className="relative inline-block text-4xl lg:text-[56px] font-bold text-white leading-[1.2]">
        Komitmen Kami
        {/* Dekorasi Garis Kuning */}
        <span className="absolute left-0 -bottom-2 w-full h-[6px] bg-[#FFD600] rounded-full"></span>
      </span>

      <span className="text-4xl lg:text-[56px] font-bold block text-white mt-4 leading-[1.2]">
        dalam Memajukan
      </span>

      <span className="text-4xl lg:text-[56px] font-bold block text-white leading-[1.2]">
        Islam
      </span>
    </h2>
  </div>

  {/* Bagian Kanan: Deskripsi dengan Align Justify */}
  <div className="w-full lg:w-[50%] text-[15px] lg:text-[16px] leading-[1.8] font-normal relative z-10 space-y-6 text-justify text-white/90">
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

        {/* STATS OVERLAY */}
        <div className="max-w-5xl mx-auto -mt-14 relative z-30 px-4">
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200 overflow-hidden">
            {[
              { label: 'Siswa Aktif', val: '150', icon: '👥', color: '#0A8F47' },
              { label: 'Pengajar', val: '25', icon: '🏫', color: '#D32F2F' },
              { label: 'Penghargaan', val: '100', icon: '🏆', color: '#F9A825' },
            ].map((stat, i) => (
              <div key={i} className="flex-1 p-6 lg:p-8 flex items-center justify-center gap-5">
                <div className="text-4xl lg:text-5xl flex-shrink-0">{stat.icon}</div>
                <div>
                  <div className="text-3xl lg:text-5xl font-extrabold" style={{ color: stat.color }}>
                    {stat.val}<span className="text-2xl lg:text-4xl">+</span>
                  </div>
                  <div className="text-xs lg:text-sm text-gray-500 font-medium mt-1 uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
{/* --- BROSUR PPDB SECTION --- */}
<section className="px-0 py-24 text-center lg:px-0"> 
  <h2 className="text-4xl font-black text-[#333333] lg:text-5xl px-4">Brosur PPDB</h2>
  <p className="max-w-2xl mx-auto mt-6 text-[#777777] font-medium text-base px-4">
    Brosur resmi yang memuat informasi singkat mengenai profil madrasah, program pendidikan, fasilitas, serta penerimaan peserta didik baru.
  </p>
  

  <div className="mt-16 w-full mx-auto relative aspect-auto min-h-[600px] md:min-h-[800px] lg:min-h-screen overflow-hidden group">
     <Image 
      src="/brosur.png" 
      alt="Brosur PPDB MA Persis Kudang" 
      fill 
      className="object-contain transition-transform duration-500 h"
      priority
     />
  </div>
</section>
     <Footer />
    </div>
  );
}