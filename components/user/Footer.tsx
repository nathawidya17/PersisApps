import React from "react";
import { Mail, Phone, MapPin, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-[#F8FFF9] pt-16 pb-8 px-4 md:px-24 font-sans border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Container Utama dengan justify-between */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
          
          {/* Bagian Kiri: Logo & Deskripsi */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="relative w-10 h-10">
                <img 
                  src="/logopersis.png" 
                  alt="Logo Persis"
                  className="object-contain"
                />
              </div>
              <h2 className="text-[#068A50] font-bold text-[20px] tracking-tight uppercase">
                MA Persis Kudang
              </h2>
            </div>
            
            <p className="text-[#4B5563] text-[15px] leading-[1.8] text-justify max-w-[480px]">
              Pesantren Persis 212 Kudang merupakan lembaga pendidikan Islam berbasis 
              pesantren di Kabupaten Garut yang mengintegrasikan pendidikan agama dan umum, 
              serta aktif dalam dakwah dan kegiatan sosial. Pesantren ini berkomitmen menjaga 
              nilai-nilai keislaman sekaligus adaptif terhadap perkembangan zaman.
            </p>
          </div>

          {/* Bagian Kanan: Kontak didorong penuh ke kanan */}
          <div className="md:text-left min-w-[300px]">
            <h3 className="text-[#068A50] font-bold text-xl mb-8">Kontak</h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-[#4B5563]">
                <Mail size={20} className="text-[#068A50] shrink-0" />
                <span className="text-[15px]">mapersiskudang@gmail.com</span>
              </div>
              
              <div className="flex items-center gap-4 text-[#4B5563]">
                <Phone size={20} className="text-[#068A50] shrink-0" />
                <span className="text-[15px]">+6285117048212</span>
              </div>
              
              <div className="flex items-start gap-4 text-[#4B5563] max-w-[300px]">
                <MapPin size={20} className="text-[#068A50] mt-1 shrink-0" />
                <span className="text-[15px] leading-relaxed">
                  Jl. Kudang 1, Wanajaya, Kec. Wanaraja, Kabupaten Garut, Jawa Barat 44183
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Garis Pemisah */}
        <div className="border-t border-gray-200/60 mb-8 w-full"></div>

        {/* Bagian Bawah */}
        {/* Container Utama Bawah: Mengatur posisi Teks dan Grup Ikon */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          
          <div className="text-[#4B5563] text-[14px] font-medium text-center">
            @ 2025 Point Studio All rights reserved
          </div>
          
          {/* WRAPPER BARU: Membungkus kedua ikon agar sejajar (samping-sampingan) di mobile */}
          <div className="flex items-center gap-6">
            <a href="https://www.instagram.com/mapersiskudang?igsh=MWw0bXZubDBnbWFrbQ==" className="text-[#0A8F47] hover:text-[#068A50] transition-all bg-green-50 p-2 rounded-full">
               <Instagram size={18} strokeWidth={2} />
             </a>
             <a href="https://youtube.com/@mapersiskudang?si=tyiR_XmHYuwprBzr" className="text-[#0A8F47] hover:text-[#068A50] transition-all bg-green-50 p-2 rounded-full flex items-center justify-center">
               <svg 
                 xmlns="http://www.w3.org/2000/svg" 
                 width="18" 
                 height="18" 
                 fill="currentColor" 
                 className="bi bi-youtube" 
                 viewBox="0 0 16 16"
               >
                <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z"/>
               </svg>
             </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;