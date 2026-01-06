"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ChevronLeft, CheckCircle, Info, Gift } from "lucide-react";

export default function DetailCalonSiswaPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("tagihan");

  useEffect(() => {
    if (id && id !== "undefined") {
      const fetchDetail = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`/server/api/admin/PPDB/${id}`);
          setData(res.data);
          setError("");
        } catch (err: any) {
          setError(err.response?.data?.error || "Gagal memuat data siswa");
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [id]);

  if (loading) return <div className="ml-64 p-10 text-gray-400 font-medium text-center">Memuat Detail...</div>;
  if (error) return <div className="ml-64 p-10 text-red-500 text-center">{error}</div>;

  const s = data?.detail;
  const isDaftarUlang = data?.status_tahap === "Daftar Ulang";

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const masterTagihan = data?.jenis_pembayaran || []; 
  const riwayatDaftarUlang = s?.tb_daftar_ulang?.[0]?.tb_pembayaran_daftar_ulang || [];
  const riwayatPendaftaran = s?.tb_pembayaran_pendaftaran || [];
  const semuaRiwayatBayar = [...riwayatDaftarUlang, ...riwayatPendaftaran];

  const daftarTagihanFinal = masterTagihan.map((jenis: any) => {
    const totalTerbayar = semuaRiwayatBayar
      .filter((p: any) => {
        if (p.id_jenis_pembayaran) {
          return Number(p.id_jenis_pembayaran) === Number(jenis.id_jenis_pembayaran);
        }
        return Number(jenis.id_jenis_pembayaran) === 1;
      })
      .reduce((acc: number, curr: any) => acc + (Number(curr.nominal) || 0), 0);

    const nominalTagihan = Number(jenis.nominal) || 0;
    const sisa = Math.max(0, nominalTagihan - totalTerbayar);

    return {
      nama: jenis.nama_pembayaran,
      total: nominalTagihan,
      terbayar: totalTerbayar,
      sisa: sisa,
      lunas: totalTerbayar >= nominalTagihan && nominalTagihan > 0
    };
  });

  const grandTotalTagihan = daftarTagihanFinal.reduce((acc: number, curr: any) => acc + curr.total, 0);
  const grandTotalTerbayar = daftarTagihanFinal.reduce((acc: number, curr: any) => acc + curr.terbayar, 0);
  const grandSisaTagihan = grandTotalTagihan - grandTotalTerbayar;
  const statusLunasGlobal = grandTotalTagihan > 0 && grandSisaTagihan === 0;

  return (
    /* px-5 pt-5 (20px) agar sama dengan Dashboard & Daftar Siswa */
    <div className="ml-64 bg-gray-50 min-h-screen pb-10 px-5 pt-5 antialiased font-sans">
      
      {/* Breadcrumb & Header - Spacing mb-5 (20px) */}
      <div className="flex flex-col mb-5">
        <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest">
          PPDB / <span className="text-green-600">Detail Calon Siswa</span>
        </p>
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-800 hover:opacity-70 transition-all cursor-pointer">
            <ChevronLeft size={20} className="text-gray-700" />
            <h2 className="text-xl font-bold tracking-tight">Detail Calon Siswa</h2>
          </button>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-[#5BA47E] text-white rounded-[8px] text-sm font-semibold flex items-center gap-2 shadow-sm transition-all hover:bg-[#4a8a68] cursor-pointer">
              <CheckCircle size={18} /> Validasi Calon Siswa
            </button>
            <button className="px-5 py-2.5 bg-white border border-gray-200 text-green-600 rounded-[8px] text-sm font-semibold flex items-center gap-2 transition-all hover:bg-green-50 cursor-pointer">
              <Gift size={18} /> Beri Keringanan
            </button>
          </div>
        </div>
      </div>

      {/* Main Info Cards - gap-5 (20px) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-5">
        <div className="lg:col-span-3 bg-white p-8 rounded-[12px] shadow-sm border border-gray-100">
          <div className="mb-8">
             <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{s?.nama_lengkap}</h3>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400 uppercase tracking-widest">{s?.email || "siswa@persis.com"}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${isDaftarUlang ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                  {data?.status_tahap}
                </span>
             </div>
          </div>
          <div className="grid grid-cols-4 gap-y-8 gap-x-4">
            <InfoItem label="Tempat Tanggal Lahir" value={`${s?.tempat_lahir}, ${s?.tanggal_lahir?.split('T')[0]}`} />
            <InfoItem label="Jenis Kelamin" value={s?.jenis_kelamin} />
            <InfoItem label="Anak ke" value={s?.anak_ke} />
            <InfoItem label="Jumlah Saudara" value={s?.jumlah_saudara} />
            <InfoItem label="Jalur Pendaftaran" value={<span className="capitalize">{s?.jalur_pendaftaran}</span>} />
            <InfoItem label="No Hp" value={s?.no_hp} />
            <InfoItem label="Ukuran Baju" value={s?.ukuran_baju} />
            <InfoItem label="Alamat" value={s?.alamat_rumah} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[12px] shadow-sm border border-gray-100">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">NISN</h3>
          <p className="text-sm font-bold text-gray-800 mb-8">{s?.nisn}</p>
          <div className="grid grid-cols-2 gap-y-8 gap-x-2">
            <InfoItem label="Status Siswa" value={<span className="text-green-600 font-bold capitalize">{s?.tipe_siswa}</span>} />
            <InfoItem label="Asal Sekolah" value={s?.asal_sekolah} />
            <InfoItem label="Tahun Lulus" value={s?.tahun_lulus} />
            <InfoItem label="Alamat Sekolah" value={<span className="capitalize truncate block max-w-full">{s?.alamat_sekolah}</span>} />
          </div>
        </div>
      </div>

      {/* Parent Card - Spacing mb-5 (20px) */}
      <div className="bg-white p-8 rounded-[12px] shadow-sm border border-gray-100 mb-5">
        <h3 className="text-[15px] font-bold text-gray-900 mb-8 tracking-tight uppercase tracking-widest">Data Orang Tua</h3>
        <div className="grid grid-cols-5 gap-y-10 gap-x-4">
          <InfoItem label="Nama Ayah" value={s?.nama_ayah} />
          <InfoItem label="Lahir Ayah" value={`${s?.tempat_lahir_ayah || '-'}, ${s?.tanggal_lahir_ayah?.split('T')[0] || '-'}`} />
          <InfoItem label="Pendidikan" value={s?.pendidikan_ayah} />
          <InfoItem label="Pekerjaan" value={s?.pekerjaan_ayah} />
          <InfoItem label="Penghasilan" value={s?.penghasilan_ayah} />

          <InfoItem label="Nama Ibu" value={s?.nama_ibu} />
          <InfoItem label="Lahir Ibu" value={`${s?.tempat_lahir_ibu || '-'}, ${s?.tanggal_lahir_ibu?.split('T')[0] || '-'}`} />
          <InfoItem label="Pendidikan" value={s?.pendidikan_ibu} />
          <InfoItem label="Pekerjaan" value={s?.pekerjaan_ibu} />
          <InfoItem label="Penghasilan" value={s?.penghasilan_ibu} />

          <InfoItem label="No Hp Ortu" value={s?.no_hp_orang_tua} />
          <div className="col-span-4">
             <InfoItem label="Alamat" value={s?.alamat_rumah} />
          </div>
        </div>
      </div>

      {/* Tab Section */}
      <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 px-2">
          <TabButton active={activeTab === "tagihan"} onClick={() => setActiveTab("tagihan")} label="Daftar Tagihan" />
          <TabButton active={activeTab === "dokumen"} onClick={() => setActiveTab("dokumen")} label="Dokumen" />
          <TabButton active={activeTab === "prestasi"} onClick={() => setActiveTab("prestasi")} label="Prestasi" />
        </div>

        <div className="p-8">
          {/* Summary Cards - gap-5 (20px) */}
          <div className="grid grid-cols-4 gap-5 mb-8">
            <SummaryCard label="Total Tagihan" value={formatIDR(grandTotalTagihan)} />
            <SummaryCard label="Total Terbayar" value={formatIDR(grandTotalTerbayar)} className="text-green-600" />
            <SummaryCard label="Sisa Tagihan" value={formatIDR(grandSisaTagihan)} className="text-red-600" />
            <div className={`p-5 rounded-[12px] border flex flex-col gap-1 ${statusLunasGlobal ? "border-green-100 bg-green-50/30" : "border-red-100 bg-red-50/30"}`}>
               <p className={`text-[10px] font-bold uppercase tracking-widest ${statusLunasGlobal ? "text-green-400" : "text-red-400"}`}>Status Pembayaran</p>
               <p className={`text-[17px] font-bold ${statusLunasGlobal ? "text-green-600" : "text-red-600"}`}>
                 {statusLunasGlobal ? "Lunas" : "Belum Lunas"}
               </p>
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-gray-50">
                <th className="py-5 px-4 font-semibold">Nama Tagihan</th>
                <th className="py-5 px-4 font-semibold">Total Tagihan</th>
                <th className="py-5 px-4 font-semibold">Total Terbayar</th>
                <th className="py-5 px-4 font-semibold text-center">Sisa Tagihan</th>
                <th className="py-5 px-4 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#3b3b3b]">
              {daftarTagihanFinal.length > 0 ? (
                daftarTagihanFinal.map((tagihan: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-all">
                    <td className="py-5 px-4 font-bold text-gray-700">{tagihan.nama}</td>
                    <td className="py-5 px-4 font-medium text-gray-400">{formatIDR(tagihan.total)}</td>
                    <td className="py-5 px-4 text-green-600 font-bold">{formatIDR(tagihan.terbayar)}</td>
                    <td className="py-5 px-4 text-red-600 text-center font-bold">{formatIDR(tagihan.sisa)}</td>
                    <td className="py-5 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase whitespace-nowrap ${tagihan.lunas ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {tagihan.lunas ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400 font-medium">Tidak ada data tagihan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <footer className="mt-10 text-[11px] text-gray-300 font-semibold text-center tracking-widest uppercase">© PERSIS 212 KUDANG</footer>
    </div>
  );
}

// --- Sub-Components ---

function InfoItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{label}</span>
      <span className="text-[12px] font-semibold text-gray-700 leading-tight">{value || "-"}</span>
    </div>
  );
}

function TabButton({ active, label, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`px-8 py-5 text-[12px] font-bold transition-all border-b-2 cursor-pointer ${
        active ? 'border-[#068A50] text-[#068A50]' : 'border-transparent text-gray-400'
      }`}
    >
      {label}
    </button>
  );
}

function SummaryCard({ label, value, className = "" }: any) {
  return (
    <div className="p-5 rounded-[12px] border border-gray-100 bg-white shadow-sm flex flex-col gap-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className={`text-[17px] font-bold tracking-tight ${className || "text-gray-800"}`}>{value}</p>
    </div>
  );
}