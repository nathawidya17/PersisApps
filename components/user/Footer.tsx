import React from "react";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react";

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
                Persis Kudang 212
              </h2>
            </div>
            
            {/* max-w-[450px] digunakan agar teks terpotong ke bawah sesuai struktur yang Anda minta,
               text-justify memastikan rata kanan-kiri tetap aktif.
            */}
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
                <span className="text-[15px]">persiskudang@gmail.com</span>
              </div>
              
              <div className="flex items-center gap-4 text-[#4B5563]">
                <Phone size={20} className="text-[#068A50] shrink-0" />
                <span className="text-[15px]">+62 811-2222-3333</span>
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
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="text-[#4B5563] text-[14px] font-medium">
            @ 2025 Point Studio All rights reserved
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-[#428E5F] hover:text-[#068A50] transition-all">
              <Facebook size={20} fill="currentColor" strokeWidth={0} />
            </a>
            <a href="#" className="text-[#428E5F] hover:text-[#068A50] transition-all">
              <Instagram size={20} strokeWidth={2} />
            </a>
            <a href="#" className="text-[#428E5F] hover:text-[#068A50] transition-all">
              <Youtube size={24} fill="currentColor" strokeWidth={0} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;