"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, CheckCircle2, ChevronDown } from "lucide-react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { displayGender } from "@/lib/gender";

// --- HELPERS ---
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  });
};

const formatIDR = (val: number) => 
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

export default function ResultTagihanPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // --- STATE FILTER & SEARCH ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "lunas" | "belum">("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("dataTagihanSiswa");
    if (!stored) {
      router.push("/client/user/cek-tagihan");
    } else {
      setData(JSON.parse(stored));
    }

    // Close dropdown ketika klik di luar
    function handleClickOutside(event: any) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, [router]);

  if (!data) return null;

const siswa = data?.siswa || {};
const tagihan = data?.tagihan || [];
const ringkasan = data?.ringkasan || { total: 0, terbayar: 0, sisa: 0 };

  const toggleSelect = (id: number, sisa: number) => {
    if (sisa <= 0) return; 
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

 const totalSelected = (tagihan || [])
    .filter((t: any) => selectedIds.includes(t.id))
    .reduce((acc: number, curr: any) => acc + (curr.sisa || 0), 0);

  const handleBayar = () => {
    const itemsToPay = tagihan
        .filter((t: any) => selectedIds.includes(t.id))
        .map((t: any) => ({
            id_jenis: t.id,
            nama: t.nama,
            nominal_bayar: t.sisa 
        }));
    
    sessionStorage.setItem("itemsToPay", JSON.stringify({
        siswa: siswa,
        items: itemsToPay,
        total: totalSelected
    }));
    
    router.push("/client/user/cek-tagihan/bayar");
  };

  // --- LOGIC FILTERING ---
  const filteredTagihan = tagihan.filter((item: any) => {
    // 1. Filter by Name (Search)
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Filter by Status
    const isLunas = item.sisa <= 0;
    let matchesStatus = true;
    
    if (filterStatus === "lunas") matchesStatus = isLunas;
    if (filterStatus === "belum") matchesStatus = !isLunas;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#333] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-[1250px] w-full mx-auto px-4 md:px-6 py-10">
        
        {/* === SECTION 1: KARTU TERPISAH (BIODATA & NISN) === */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            
            {/* CARD 1: BIODATA SISWA */}
            <div className="lg:col-span-8 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full">
                <div className="mb-6 pb-4 border-b border-gray-50">
                    <h1 className="text-2xl font-bold text-gray-900">{siswa.nama}</h1>
                    <p className="text-sm text-gray-400">{siswa.email || "user@gmail.com"}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 ">
                    <InfoItem label="Tempat Tanggal Lahir" value={`${siswa.tempat_lahir || '-'}, ${formatDate(siswa.tanggal_lahir)}`} />
                    <InfoItem label="Jenis Kelamin" value={displayGender(siswa.jenis_kelamin) || '-'} />
                    <InfoItem label="Anak ke" value={siswa.anak_ke || '-'} />
                    <InfoItem label="Jumlah Saudara" value={siswa.jumlah_saudara || '-'} />
                    <InfoItem label="Jalur Pendaftaran" value={siswa.jalur_pendaftaran || '-'} />
                    <InfoItem label="No Hp" value={siswa.no_hp || '-'} />
                    <InfoItem label="Ukuran Baju Olahraga" value={siswa.ukuran_baju || '-'} />
                    <InfoItem label="Alamat Lengkap" value={siswa.alamat_rumah || '-'} />
                </div>
            </div>

            {/* CARD 2: NISN */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full flex flex-col justify-center">
                <div className="mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">NISN</p>
                    <p className="text-3xl font-bold text-gray-800 tracking-tight">{siswa.nisn}</p>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <InfoItem label="Status Siswa" value={siswa.status_siswa || 'Reguler'} highlight />
                       <InfoItem label="Tahun Lulus" value={siswa.tahun_lulus || '-'} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <InfoItem label="Asal Sekolah" value={siswa.asal_sekolah || '-'} />
                       <InfoItem label="Alamat Sekolah" value={siswa.alamat_sekolah || '-'} />
                    </div>
                </div>
            </div>
        </div>

        {/* === SECTION 2: RINGKASAN TAGIHAN === */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-50 pb-2">Ringkasan Tagihan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard title="Total Tagihan" amount={ringkasan.total} color="text-gray-900" />
                <SummaryCard title="Total Terbayar" amount={ringkasan.terbayar} color="text-[#428E5F]" />
                <SummaryCard title="Sisa Tagihan" amount={ringkasan.sisa} color="text-red-600" />
            </div>
       

        {/* === SECTION 3: FILTER & SEARCH === */}
        <div className="flex justify-between items-center mb-6 mt-6">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Cari tagihan..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#428E5F] text-sm bg-white shadow-sm"
                />
            </div>

            {/* FILTER BUTTON WITH DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`
                        flex items-center gap-2 px-6 py-3 border rounded-xl text-sm font-bold transition-all shadow-sm
                        ${filterStatus !== 'all' ? 'bg-[#428E5F] text-white border-[#428E5F]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                    `}
                >
                    <Filter size={16} /> 
                    {filterStatus === 'all' ? 'Filter Status' : filterStatus === 'lunas' ? 'Sudah Lunas' : 'Belum Lunas'}
                    <ChevronDown size={16} className={`transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`}/>
                </button>

                {/* Dropdown Menu */}
                {showFilterDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="py-1">
                            <button 
                                onClick={() => { setFilterStatus("all"); setShowFilterDropdown(false); }}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${filterStatus === 'all' ? 'text-[#428E5F] font-bold bg-green-50' : 'text-gray-600'}`}
                            >
                                Semua Tagihan
                            </button>
                            <button 
                                onClick={() => { setFilterStatus("lunas"); setShowFilterDropdown(false); }}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${filterStatus === 'lunas' ? 'text-[#428E5F] font-bold bg-green-50' : 'text-gray-600'}`}
                            >
                                Sudah Lunas
                            </button>
                            <button 
                                onClick={() => { setFilterStatus("belum"); setShowFilterDropdown(false); }}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${filterStatus === 'belum' ? 'text-[#428E5F] font-bold bg-green-50' : 'text-gray-600'}`}
                            >
                                Belum Lunas
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* === SECTION 4: GRID TAGIHAN === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
            {filteredTagihan.length > 0 ? (
                filteredTagihan.map((item: any) => {
                    const isLunas = item.sisa <= 0;
                    const isSelected = selectedIds.includes(item.id);

                    return (
                        <div 
                            key={item.id}
                            onClick={() => toggleSelect(item.id, item.sisa)}
                            className={`
                                relative bg-white p-6 rounded-2xl border transition-all cursor-pointer group hover:shadow-lg
                                ${isLunas ? 'border-gray-100 bg-gray-50/50 opacity-80' : isSelected ? 'border-[#428E5F] ring-2 ring-[#428E5F] bg-green-50/10' : 'border-gray-100 hover:border-green-200'}
                            `}
                        >
                            <div className="mb-6 flex justify-between items-start h-10">
                                <h3 className="font-bold text-gray-800 text-[15px] leading-snug">{item.nama}</h3>
                                {isSelected && <CheckCircle2 className="text-[#428E5F] shrink-0" size={22} />}
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-gray-500">Total Tagihan :</span>
                                    <span className="font-bold text-gray-800">{item.total_tagihan.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-gray-500">Total Terbayar :</span>
                                    <span className="font-bold text-[#428E5F]">{item.terbayar.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-[13px] pt-2 border-t border-gray-100">
                                    <span className="text-gray-500">Sisa Tagihan :</span>
                                    <span className="font-bold text-red-600">{item.sisa.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <span className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                                    ${isLunas ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}
                                `}>
                                    {isLunas ? "Lunas" : "Belum Lunas"}
                                </span>
                            </div>
                        </div>
                    )
                })
            ) : (
                <div className="col-span-full py-12 text-center text-gray-400">
                    <p>Tidak ada tagihan yang sesuai filter.</p>
                </div>
            )}
        </div>
        
        {/* === SECTION 5: CARD TOTAL & TOMBOL BAYAR === */}
        {totalSelected > 0 && (
            <div className="flex justify-end pt-6 pb-12 animate-in slide-in-from-bottom-5">
                    <div className="flex flex-col items-end">
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Dipilih</p>
                        <p className="text-2xl font-bold text-[#428E5F]">
                            {formatIDR(totalSelected)}
                        </p>
                    </div>
                    <button 
                        disabled={totalSelected === 0}
                        onClick={handleBayar}
                        className={`
                            font-bold py-3 px-8 rounded-lg text-sm transition-all shadow-md ml-6
                            ${totalSelected > 0 
                                ? "bg-[#428E5F] text-white hover:bg-[#36754e] active:scale-95 hover:shadow-lg" 
                                : "bg-[#E0E0E0] text-white cursor-not-allowed"} 
                        `}
                    >
                        Bayar Tagihan
                    </button>
                </div>
        )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// --- SUB COMPONENTS ---

function InfoItem({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
    return (
        <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={`text-[13px] font-semibold leading-relaxed ${highlight ? 'text-[#428E5F]' : 'text-gray-700'}`}>
                {value}
            </p>
        </div>
    );
}

function SummaryCard({ title, amount, color }: { title: string, amount: any, color: string }) {
    return (
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-800 uppercase mb-3 flex items-baseline gap-1">
                {/* TAMBAHKAN (amount || 0) DISINI */}
                IDR <span className={`text-2xl ${color}`}>{(amount || 0).toLocaleString('id-ID')}</span>
            </p>
            <p className="text-[11px] font-medium text-gray-400">{title}</p>
        </div>
    );
}