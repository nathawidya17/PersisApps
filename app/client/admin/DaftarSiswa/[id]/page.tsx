"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  ChevronLeft, Edit, Trash2, Search, 
  Download, Plus, Info 
} from "lucide-react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

export default function DetailSiswaPage() {
  const { id } = useParams();
  const router = useRouter();

  // --- States ---
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tagihan");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // --- Data Fetching ---
  const fetchDetail = () => {
    setLoading(true);
    axios.get(`/server/api/admin/DaftarSiswa/${id}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // --- Memos & Logic ---
  const s = data?.detailSiswa;
  
  const ortu = useMemo(() => {
    return s?.tb_orang_tua && s.tb_orang_tua.length > 0 ? s.tb_orang_tua[0] : null;
  }, [s]);

  const tagihanStats = useMemo(() => {
    if (!data?.detailSiswa || !data?.jenisTagihan) {
      return { total: 0, terbayar: 0, sisa: 0, isLunas: false };
    }
    const totalTagihan = data.jenisTagihan.reduce((acc: number, curr: any) => acc + (curr.nominal || 0), 0);
    const riwayat = s?.tb_pembayaran_daftar_ulang || [];
    const totalTerbayar = riwayat.reduce((acc: number, curr: any) => acc + (curr.nominal || 0), 0);
    const sisa = totalTagihan - totalTerbayar;
    return { total: totalTagihan, terbayar: totalTerbayar, sisa, isLunas: sisa <= 0 };
  }, [data, s]);

  const filteredTagihan = useMemo(() => {
    if (!data?.jenisTagihan) return [];

    return data.jenisTagihan.filter((jt: any) => {
      const riwayat = s?.tb_pembayaran_daftar_ulang || [];
      const terbayar = riwayat
        .filter((p: any) => p.id_jenis_pembayaran === jt.id)
        .reduce((acc: number, curr: any) => acc + (curr.nominal || 0), 0);
      const sisa = jt.nominal - terbayar;
      const isLunas = sisa <= 0;

      const matchesSearch = jt.nama_pembayaran.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "lunas" && isLunas) ||
        (filterStatus === "belum_lunas" && !isLunas);

      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, filterStatus, s]);

  // --- Handlers ---
  const handleDelete = () => {
    Swal.fire({
      width: 380,
      padding: "40px",
      background: "#ffffff",
      iconHtml: `
        <div class="w-16 h-16 rounded-full bg-[#9B1C1C] flex items-center justify-center mx-auto">
          <span class="text-white text-3xl font-bold leading-none">!</span>
        </div>
      `,
      title: "Hapus Data",
      html: `
        <p class="text-gray-500 text-sm text-center">
          Apakah Anda yakin ingin menghapus data ini?<br />Tindakan ini bersifat permanen.
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batalkan",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: "!rounded-[40px] overflow-hidden",
        icon: "border-0 mt-0",
        title: "text-xl font-bold text-gray-900 pt-5 text-center",
        actions: "flex gap-3 mt-8",
        confirmButton: "bg-[#9B1C1C] hover:bg-[#7f1616] text-white font-semibold px-8 py-3 rounded-full",
        cancelButton: "border border-gray-300 text-gray-600 font-semibold px-8 py-3 rounded-full",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`/server/api/admin/DaftarSiswa/${id}`);
          Swal.fire({
            title: "Terhapus!",
            text: "Data siswa berhasil dihapus.",
            icon: "success",
            confirmButtonColor: "#068A50",
          });
          router.push("/client/admin/DaftarSiswa");
        } catch (error: any) {
          Swal.fire({
            title: "Gagal!",
            text: error.response?.data?.error || "Terjadi kesalahan.",
            icon: "error",
          });
        }
      }
    });
  };

  const handleExport = () => {
    if (!s || !data?.jenisTagihan) return;
    const ws = XLSX.utils.json_to_sheet(data.jenisTagihan);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tagihan");
    XLSX.writeFile(wb, `Laporan_${s.NISN}.xlsx`);
  };

  if (loading) {
    return <div className="ml-64 p-10 text-gray-400 font-medium tracking-tight">Memuat Detail...</div>;
  }

  return (
    <div className="ml-64 bg-[#F9FBFC] min-h-screen pb-12 px-10 pt-6 antialiased font-sans">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] text-gray-400 mb-4 font-medium ">
        <span>Daftar Siswa</span> 
        <span className="text-gray-300">/</span> 
        <span className="text-[#068A50]">Detail Siswa</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-800 hover:opacity-70 transition-all">
          <ChevronLeft size={20} className="text-gray-700" />
          <h2 className="text-lg font-bold tracking-tight text-gray-900">Detail Siswa</h2>
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => router.push(`/client/admin/DaftarSiswa/${id}/edit`)}
            className="px-4 py-2 bg-[#5BA47E] text-white rounded-lg text-[12px] font-semibold shadow-sm flex items-center gap-2 transition-all hover:bg-[#4a8a68]"
          >
            <Edit size={14} /> Edit
          </button>
          <button 
            onClick={handleDelete}
            className="px-4 py-2 bg-white border border-gray-200 text-red-500 rounded-lg text-[12px] font-semibold shadow-sm flex items-center gap-2 transition-all hover:bg-red-50"
          >
            <Trash2 size={14} /> Hapus
          </button>
        </div>
      </div>

      {/* Profile & NISN Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{s.nama_lengkap}</h3>
            <p className="text-[12px] text-gray-400 mt-1">{s.email || "user@gmail.com"}</p>
          </div>
          <div className="grid grid-cols-4 gap-y-8 gap-x-4">
            <InfoItem label="Tempat, Tanggal Lahir" value={`${s.tempat_lahir}, ${s.tanggal_lahir?.split('T')[0]}`} />
            <InfoItem label="Jenis Kelamin" value={s.jenis_kelamin} />
            <InfoItem label="Anak ke" value={s.anak_ke} />
            <InfoItem label="Jumlah Saudara" value={s.jumlah_saudara} />
            <InfoItem label="Jalur Pendaftaran" value={s.jalur_pendaftaran} />
            <InfoItem label="No Hp" value={s.no_hp} />
            <InfoItem label="Ukuran Baju" value={s.ukuran_baju} />
            <InfoItem label="Alamat Lengkap" value={s.alamat} />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">NISN</h3>
          <p className="text-[13px] font-semibold text-gray-300 mb-10">{s.NISN}</p>
          <div className="grid grid-cols-2 gap-y-8">
            <InfoItem label="Status Siswa" value={<span className="text-[#068A50] font-bold capitalize">{s.tipe_siswa?.toLowerCase()}</span>} />
            <InfoItem label="Asal Sekolah" value={s.asal_sekolah} />
            <InfoItem label="Tahun Lulus" value={s.tahun_lulus} />
            <InfoItem label="Alamat Sekolah" value={<span className="truncate block max-w-[120px]">{s.alamat_sekolah}</span>} />
          </div>
        </div>
      </div>

      {/* Parent Info Card */}
      <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 mb-8">
        <h3 className="text-[15px] font-bold text-gray-900 mb-8 tracking-tight">Data Orang Tua</h3>
        <div className="grid grid-cols-5 gap-y-10 gap-x-4">
          <InfoItem label="Nama Ayah" value={ortu?.nama_ayah} />
          <InfoItem label="TTL Ayah" value={ortu?.tempat_lahir_ayah ? `${ortu.tempat_lahir_ayah}, ${ortu.tanggal_lahir_ayah?.split('T')[0]}` : "-"} />
          <InfoItem label="Pendidikan" value={ortu?.pendidikan_ayah} />
          <InfoItem label="Pekerjaan" value={ortu?.pekerjaan_ayah} />
          <InfoItem label="Penghasilan" value={ortu?.penghasilan_ayah} />
          <InfoItem label="Nama Ibu" value={ortu?.nama_ibu} />
          <InfoItem label="TTL Ibu" value={ortu?.tempat_lahir_ibu ? `${ortu.tempat_lahir_ibu}, ${ortu.tanggal_lahir_ibu?.split('T')[0]}` : "-"} />
          <InfoItem label="Pendidikan" value={ortu?.pendidikan_ibu} />
          <InfoItem label="Pekerjaan" value={ortu?.pekerjaan_ibu} />
          <InfoItem label="Penghasilan" value={ortu?.penghasilan_ibu} />
          <InfoItem label="No Hp Orang Tua" value={ortu?.no_hp_orang_tua} />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-10 mb-8 border-b border-gray-100 px-2">
        {['Tagihan', 'Dokumen', 'Prestasi'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab.toLowerCase())} 
            className={`text-[12px] font-bold pb-4 transition-all ${activeTab === tab.toLowerCase() ? 'border-b-2 border-[#068A50] text-gray-900' : 'text-gray-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content: Tagihan */}
      {activeTab === 'tagihan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <TagihanCard label="Total Tagihan" value={tagihanStats.total} />
            <TagihanCard label="Total Terbayar" value={tagihanStats.terbayar} />
            <TagihanCard label="Sisa Tagihan" value={tagihanStats.sisa} />
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status Pembayaran</p>
              <p className={`text-[17px] font-bold ${tagihanStats.isLunas ? 'text-green-600' : 'text-red-500'}`}>
                {tagihanStats.isLunas ? 'Lunas' : 'Belum Lunas'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-gray-50">
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Cari tagihan..." 
                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[12px] w-64 focus:outline-none" 
                  />
                </div>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)} 
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-500 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="lunas">Lunas</option>
                  <option value="belum_lunas">Belum Lunas</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-500 font-bold shadow-sm hover:bg-gray-50 transition-all">
                  <Download size={14}/> Export
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-green-100 text-[#068A50] rounded-lg text-[11px] font-bold hover:bg-green-50 transition-all">
                  <Plus size={14}/> Transaksi
                </button>
              </div>
            </div>
            
            <div className="min-h-[300px]">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr className="text-[10px] text-gray-400 font-bold border-b border-gray-50 uppercase tracking-widest">
                    <th className="px-8 py-5">Nama Tagihan</th>
                    <th className="px-8 py-5">Total</th>
                    <th className="px-8 py-5 text-center">Terbayar</th>
                    <th className="px-8 py-5 text-center">Sisa</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-center">Update</th>
                    <th className="px-8 py-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTagihan.length > 0 ? (
                    filteredTagihan.map((jt: any, i: number) => {
                      const riwayat = s?.tb_pembayaran_daftar_ulang || [];
                      const terbayar = riwayat.filter((p: any) => p.id_jenis_pembayaran === jt.id).reduce((acc: number, curr: any) => acc + (curr.nominal || 0), 0);
                      const sisa = jt.nominal - terbayar;
                      return (
                        <tr key={i} className="hover:bg-gray-50/30 text-[11px] transition-all">
                          <td className="px-8 py-5 font-bold text-gray-700">{jt.nama_pembayaran}</td>
                          <td className="px-8 py-5 font-medium text-gray-500">IDR {jt.nominal?.toLocaleString('id-ID')}</td>
                          <td className="px-8 py-5 text-center text-green-600 font-bold">IDR {terbayar.toLocaleString('id-ID')}</td>
                          <td className="px-8 py-5 text-center text-red-500 font-bold">IDR {sisa.toLocaleString('id-ID')}</td>
                          <td className="px-8 py-5 text-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold whitespace-nowrap ${sisa <= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                              {sisa <= 0 ? 'Lunas' : 'Belum Lunas'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center text-gray-400 font-medium">{s.updated_at?.split('T')[0]}</td>
                          <td className="px-8 py-5 text-center">
                            <button className="text-[#068A50] hover:bg-green-50 p-1 rounded-md transition-all"><Info size={16} /></button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="bg-gray-50 p-4 rounded-full">
                            <Search size={40} className="text-gray-200" />
                          </div>
                          <p className="text-gray-500 text-sm font-semibold">Data Tagihan tidak ditemukan</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <footer className="mt-12 text-[10px] text-gray-300 font-semibold text-center tracking-widest uppercase">© PERSIS 212 KUDANG</footer>
    </div>
  );
}

// --- Sub-Components ---
function InfoItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</span>
      <span className="text-[12px] font-semibold text-gray-700">{value || "-"}</span>
    </div>
  );
}

function TagihanCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</span>
      <span className="text-[17px] font-bold text-gray-800 tracking-tight">IDR {value.toLocaleString('id-ID')}</span>
    </div>
  );
}