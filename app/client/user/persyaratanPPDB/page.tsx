"use client";

import React, { useState } from 'react';
import Navbar from '@/components/user/Navbar';
import Footer from '@/components/user/Footer';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function TnCPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJalur, setSelectedJalur] = useState("");

  const handleOpenModal = () => setIsModalOpen(true);
// --- LETAKKAN KODE DISINI ---
  const handleSelectJalur = (jalurId: string) => {
    setSelectedJalur(jalurId);
    
    // Simpan sementara di browser agar bisa diambil di halaman form nanti
    localStorage.setItem('pendaftaran_jalur', jalurId);
    
    // Beri jeda sedikit agar user melihat pilihan terpilih sebelum pindah halaman
    setTimeout(() => {
      router.push('/client/user/form-pendaftaran');
    }, 400);
  };
  //

  const sections = [
    {
      title: "Syarat Pendaftaran",
      content: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        "Duis aute irure dolor in reprehenderit in voluptate velit esse.",
        "Excepteur sint occaecat cupidatat non proident, sunt in culpa."
      ]
    },
    {
      title: "Ketentuan Pendaftaran",
      content: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Sed ut perspiciatis unde omnis iste natus error sit voluptatem.",
        "At vero eos et accusamus et iusto odio dignissimos ducimus.",
        "Et harum quidem rerum facilis est et expedita distinctio.",
        "Nam libero tempore, cum soluta nobis est eligendi optio.",
        "Temporibus autem quibusdam et aut officiis debitis."
      ]
    },
    {
      title: "Seleksi dan Pengumuman",
      content: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet.",
        "Ut enim ad minima veniam, quis nostrum exercitationem ullam.",
        "Quis autem vel eum iure reprehenderit qui in ea voluptate.",
        "Nihil molestiae consequatur, vel illum qui dolorem eum."
      ]
    },
    {
      title: "Daftar Ulang",
      content: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet.",
        "Ut enim ad minima veniam, quis nostrum exercitationem ullam.",
        "Quis autem vel eum iure reprehenderit qui in ea voluptate.",
        "Nihil molestiae consequatur, vel illum qui dolorem eum."
      ]
    },
    {
      title: "Penutup",
      content: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet.",
        "Ut enim ad minima veniam, quis nostrum exercitationem ullam.",
        "Quis autem vel eum iure reprehenderit qui in ea voluptate.",
        "Nihil molestiae consequatur, vel illum qui dolorem eum."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-[#333333]">
      <Navbar />

      {/* Gunakan max-w-[1400px] atau w-[95%] agar menjorok ke kiri-kanan sesuai gambar */}
      <main className="w-[95%] max-w-[1440px] mx-auto py-6">
        
        {/* HEADER BANNER - Disesuaikan agar gambar murni terlihat jelas */}
        <div 
          className="relative w-full h-[220px] md:h-[270px] rounded-[20px] overflow-hidden flex flex-col items-center justify-center mb-12 shadow-md"
          style={{ 
            backgroundImage: "url('/Container.png')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            backgroundColor: '#3D7B54' // Fallback color
          }}
        >
          {/* Overlay dihilangkan/dipertipis agar gambar Container.png asli terlihat jelas */}
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-4xl md:text-[64px] font-bold mb-4 tracking-tight leading-tight">
              Syarat dan Ketentuan PPDB
            </h1>
            <p className="text-sm md:text-lg font-medium opacity-100">
              Terakhir diupdate pada 1 Januari 2026
            </p>
          </div>
        </div>

        {/* CONTENT AREA - Tetap menjaga margin internal agar teks nyaman dibaca */}
        <div className="max-w-[1330px] mx-auto px-4">
          <p className="text-[14px] md:text-[16px] leading-[1.8] text-gray-700 mb-10 text-justify">
            Harap membaca dan memahami syarat serta ketentuan PPDB Pesantren Persis Kudang sebelum melakukan pendaftaran. Syarat dan ketentuan ini disusun sebagai pedoman bagi calon peserta didik dan orang tua/wali dalam mengikuti proses Penerimaan Peserta Didik Baru (PPDB) Pesantren Persis Kudang agar berjalan tertib, transparan, dan sesuai ketentuan yang berlaku.
          </p>

          <div className="space-y-10">
            {sections.map((sec, idx) => (
              <div key={idx} className="space-y-4">
                <h2 className="text-[20px] font-bold text-gray-800">{sec.title}</h2>
                <ul className="list-disc list-outside ml-6 space-y-2">
                  {sec.content.map((item, i) => (
                    <li key={i} className="text-[14px] text-gray-600 leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* MAIN ACTION BUTTON - Hijau Tua sesuai tombol Login Admin di gambar */}
          <button 
            onClick={handleOpenModal}
            className="w-full mt-16 py-4 bg-[#068A50]  text-white font-bold text-lg rounded-xl transition-all shadow-lg"
          >
            Setuju dan Lanjutkan
          </button>
        </div>
      </main>

      <Footer />

      {/* MODAL JALUR PENDAFTARAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-[500px] rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-250">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800">Pilih Jalur Pendaftaran</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X size={28} />
              </button>
            </div>

            <div className="p-6 space-y-4">
  <JalurOption 
    title="Jalur Tahfidz"
    desc="Untuk calon peserta didik yang memiliki hafalan Al-Qur'an dan komitmen tahfidz."
    selected={selectedJalur === "tahfidz"} // Menggunakan huruf kecil
    onSelect={() => handleSelectJalur("tahfidz")}
  />
  <JalurOption 
    title="Jalur Prestasi"
    desc="Untuk calon peserta didik dengan prestasi akademik maupun non-akademik."
    selected={selectedJalur === "prestasi"}
    onSelect={() => handleSelectJalur("prestasi")}
  />
  <JalurOption 
    title="Jalur Umum"
    desc="Jalur pendaftaran umum untuk seluruh calon peserta didik sesuai ketentuan pesantren."
    selected={selectedJalur === "umum"}
    onSelect={() => handleSelectJalur("umum")}
  />
</div>
          </div>
        </div>
      )}
    </div>
  );
}

function JalurOption({ title, desc, selected, onSelect }: any) {
  return (
    <div 
      onClick={onSelect}
      className={`flex items-start gap-5 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
        selected ? 'border-[#2D6A4F] bg-green-50' : 'border-gray-100 hover:border-gray-300'
      }`}
    >
      <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        selected ? 'border-[#2D6A4F]' : 'border-gray-300'
      }`}>
        {selected && <div className="w-3 h-3 bg-[#2D6A4F] rounded-full" />}
      </div>
      <div>
        <h3 className={`font-bold text-[17px] ${selected ? 'text-[#2D6A4F]' : 'text-gray-800'}`}>{title}</h3>
        <p className="text-[13px] text-gray-500 leading-snug mt-1">{desc}</p>
      </div>
    </div>
  );
}