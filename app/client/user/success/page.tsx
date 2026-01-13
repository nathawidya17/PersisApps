"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/user/Navbar';
import Footer from '@/components/user/Footer';
import Image from 'next/image';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  // State untuk menampung data pendaftar yang diambil dari Local Storage
  const [studentData, setStudentData] = useState({
    nama: "",
    nisn: "",
    metode: ""
  });

  // Ambil data saat halaman dimuat
  useEffect(() => {
    // Pastikan kode berjalan di client-side
    if (typeof window !== 'undefined') {
      const savedNama = localStorage.getItem('ppdb_success_nama') || "Calon Siswa";
      const savedNisn = localStorage.getItem('ppdb_success_nisn') || "-";
      const savedMetode = localStorage.getItem('ppdb_success_metode') || "Transfer";

      setStudentData({
        nama: savedNama,
        nisn: savedNisn,
        metode: savedMetode
      });
    }
  }, []);

  // Nomor WhatsApp Admin PPDB
  const adminWhatsApp = "6285117048212";
  
  // Fungsi Chat WhatsApp Dinamis
  const handleWhatsAppChat = () => {
    const text = `Halo Admin PPDB MA Persis Kudang 212 ,\n\nSaya *${studentData.nama}* dengan NISN *${studentData.nisn}* telah melakukan pendaftaran dan pembayaran via *${studentData.metode}*.\n\nMohon bantuannya untuk melakukan verifikasi segera.\nTerima kasih.`;
    
    const message = encodeURIComponent(text);
    window.open(`https://wa.me/${adminWhatsApp}?text=${message}`, '_blank');
  };

  // Mengambil waktu saat ini secara dinamis
  const currentDateTime = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-left">
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-5 md:py-8 animate-in fade-in duration-700">
        <div className="max-w-[750px] w-full rounded-2xl p-6 md:p-16 text-center flex flex-col items-center ">
          
          {/* Ilustrasi */}
          <div className="relative w-32 h-32 md:w-48 md:h-48 mb-6 md:mb-8"> 
            <Image 
              src="/Pending Payment.svg" 
              alt="Waiting Verification" 
              fill 
              className="object-contain"
              priority
            />
          </div>

          {/* Judul Utama */}
          <h1 className="text-[22px] md:text-[28px] font-bold text-[#428E5F] mb-2 md:mb-3 tracking-tight">
            Menunggu Verifikasi Pembayaran
          </h1>
          
          {/* Tanggal Dinamis */}
          <p className="text-gray-400 text-[12px] md:text-[13px] mb-4 md:mb-6 font-medium">
            {currentDateTime} WIB
          </p>

          {/* Deskripsi */}
          <p className="text-gray-500 text-[14px] md:text-[16px] leading-relaxed max-w-[520px] mb-8 md:mb-12">
            Terima kasih <strong>{studentData.nama}</strong>, pembayaran Anda sedang dalam proses verifikasi oleh pihak sekolah. 
            Mohon menunggu konfirmasi selanjutnya atau hubungi admin melalui WhatsApp.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 md:gap-4 w-full max-w-[420px]">
            <button 
              onClick={handleWhatsAppChat}
              className="w-full bg-[#428E5F] text-white font-bold py-3 md:py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-[#36754e] active:scale-95 shadow-md group text-sm md:text-base"
            >
              Konfirmasi Melalui Whatsapp
              {/* Bootstrap Icon WhatsApp */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                fill="currentColor" 
                className="bi bi-whatsapp group-hover:scale-110 transition-transform" 
                viewBox="0 0 16 16"
              >
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.06 3.973L0 16l4.104-1.076a7.858 7.858 0 0 0 3.888 1.02h.004c4.365 0 7.923-3.558 7.927-7.926a7.854 7.854 0 0 0-2.322-5.698zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
            </button>

            <Link 
              href="/"
              className="w-full bg-white border-2 border-gray-100 text-gray-500 font-bold py-3 md:py-4 rounded-xl transition-all hover:bg-gray-50 active:scale-95 text-center shadow-sm text-sm md:text-base"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}