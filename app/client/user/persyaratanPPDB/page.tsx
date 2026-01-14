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

  const handleSelectJalur = (jalurId: string) => {
    setSelectedJalur(jalurId);
    
    // Simpan sementara di browser agar bisa diambil di halaman form nanti
    localStorage.setItem('pendaftaran_jalur', jalurId);
    
    // Beri jeda sedikit agar user melihat pilihan terpilih sebelum pindah halaman
    setTimeout(() => {
      router.push('/client/user/form-pendaftaran');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#333333]">
      <Navbar />

      <main className="w-[95%] max-w-[1440px] mx-auto py-6">
        
        {/* HEADER BANNER */}
        <div 
          className="relative w-full h-[220px] md:h-[270px] rounded-[20px] overflow-hidden flex flex-col items-center justify-center mb-12 shadow-md"
          style={{ 
            backgroundImage: "url('/Container.png')", // Pastikan gambar ini ada di folder public
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            backgroundColor: '#3D7B54' 
          }}
        >
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-3xl md:text-[56px] font-bold mb-2 tracking-tight leading-tight">
              Persyaratan PPDB MA Persis Kudang
            </h1>
            <p className="text-sm md:text-base font-medium opacity-90">
              Terakhir diupdate pada 1 Januari 2026
            </p>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="max-w-[1330px] mx-auto px-4">
          
          {/* Paragraf Pembuka */}
          <p className="text-[14px] md:text-[16px] leading-[1.8] text-gray-600 mb-10 text-justify">
            Harap membaca dan memahami Persyaratan PPDB Pesantren Persis Kudang sebelum melakukan pendaftaran. Syarat dan ketentuan ini disusun sebagai pedoman bagi calon peserta didik dan orang tua/wali dalam mengikuti proses Penerimaan Peserta Didik Baru (PPDB) Pesantren Persis Kudang agar berjalan tertib, transparan, dan sesuai ketentuan yang berlaku.
          </p>

          <div className="space-y-10 text-gray-700">
            
            {/* SECTION 1: Persyaratan Umum */}
            <div className="space-y-4">
              <h2 className="text-[22px] font-bold text-gray-800">Persyaratan Umum</h2>
              <ul className="list-disc list-outside ml-5 space-y-2 text-[15px] leading-relaxed">
                <li>Membayar Biaya Pendaftaran</li>
                <li>Mengisi dan melengkapi identitas dan data calon santri baru</li>
                <li>
                  Mempersiapkan berkas-berkas dalam bentuk scan gambar ketika pendaftaran online dan fhotocofy fisik ketika daftar ulang
                  <ul className="mt-1 ml-1 space-y-1 list-none">
                    <li>a. Ijazah / SMP / MTs (telah dilegalisir)</li>
                    <li>b. KK</li>
                    <li>c. Akta kelahiran</li>
                    <li>d. KTP orang tua</li>
                    <li>e. KIP, KKS, PKH (jika ada)</li>
                    <li>f. Pas foto ukuran 3x4 (3 lembar)</li>
                  </ul>
                </li>
              </ul>
              <p className="text-[14px] font-bold text-gray-600 mt-2">
                *Semua berkas pendaftaran disusun rapi & diserahkan menggunakan MAP Biola warna ketika daftar ulang
              </p>
            </div>

            {/* SECTION 2: Persyaratan Pendaftaran Asrama */}
            <div className="space-y-4">
              <h2 className="text-[22px] font-bold text-gray-800">Persyaratan Pendaftaran Asrama</h2>
              <ul className="list-disc list-outside ml-5 space-y-2 text-[15px] leading-relaxed">
                <li>Peralatan mandi, cuci & peralatan tidur</li>
                <li>Pakaian secukupnya</li>
              </ul>
            </div>

            {/* SECTION 3: Persyaratan Tambahan */}
            <div className="space-y-4">
              <h2 className="text-[22px] font-bold text-gray-800">Persyaratan Tambahan</h2>
              <ul className="list-disc list-outside ml-5 space-y-4 text-[15px] leading-relaxed">
                
                {/* Jalur Prestasi Akademik */}
                <li>
                  <span className="font-semibold">Jalur Prestasi Akademik :</span>
                  <ul className="mt-1 ml-1 space-y-1 list-none">
                    <li>a. File/fotokopi rapor 5 semester terakhir</li>
                    <li>b. Sertifikat prestasi/ perlombaan tingkat kabupaten/provinsi/nasional yang relevan</li>
                  </ul>
                </li>

                {/* Jalur Tahfidz */}
                <li>
                  <span className="font-semibold">Jalur Tahfidz :</span>
                  <ul className="mt-1 ml-1 space-y-1 list-none">
                    <li>a. Sertifikat tahfizh terbaru 2025 dari lembaga tahfizh atau sekolah asal</li>
                    <li>b. Sertifikat prestasi/lomba tahfidz (jika ada)</li>
                  </ul>
                </li>

              </ul>
            </div>

          </div>

          {/* MAIN ACTION BUTTON */}
          <button 
            onClick={handleOpenModal}
            className="w-full mt-16 py-4 bg-[#068A50] hover:bg-[#057a46] text-white font-bold text-lg rounded-lg transition-all shadow-lg active:scale-[0.99]"
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
                selected={selectedJalur === "tahfidz"} 
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