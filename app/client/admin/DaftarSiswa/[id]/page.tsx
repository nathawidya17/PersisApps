"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  ChevronLeft, Edit, Trash2, Search, 
  Download, Plus, Info, FileText, FolderOpen, Eye 
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

  // --- Helper: Hitung Pembayaran ---
  const getTerbayarPerJenis = (jenisTagihan: any) => {
    if (!s) return 0;
    
    let total = 0;
    const namaTagihan = (jenisTagihan.nama_pembayaran || "").toLowerCase();
    const idJenis = jenisTagihan.id_jenis_pembayaran || jenisTagihan.id; 

    // Cek Pembayaran Pendaftaran (Hanya jika tagihan ini tipe pendaftaran)
    if (namaTagihan.includes("pendaftaran")) {
       const bayarPendaftaran = s.tb_pembayaran_pendaftaran || [];
       const totalPendaftaran = bayarPendaftaran
         .filter((p: any) => p.status === 'lunas') 
         .reduce((acc: number, curr: any) => acc + (Number(curr.nominal) || 0), 0);
       
       total += totalPendaftaran;
    } 
    
    // Cek Pembayaran Daftar Ulang
    const bayarDaftarUlang = s.tb_pembayaran_daftar_ulang || [];
    const totalDaftarUlang = bayarDaftarUlang
      .filter((p: any) => {
         return Number(p.id_jenis_pembayaran) === Number(idJenis);
      })
      .filter((p: any) => p.status === 'lunas') 
      .reduce((acc: number, curr: any) => acc + (Number(curr.nominal) || 0), 0);
    
    total += totalDaftarUlang;

    return total;
  };

  // Stats Card Logic
  const tagihanStats = useMemo(() => {
    if (!data?.detailSiswa || !data?.jenisTagihan) {
      return { total: 0, terbayar: 0, sisa: 0, isLunas: false };
    }
    const totalTagihan = data.jenisTagihan.reduce((acc: number, curr: any) => acc + (Number(curr.nominal) || 0), 0);
    const totalTerbayar = data.jenisTagihan.reduce((acc: number, jt: any) => acc + getTerbayarPerJenis(jt), 0);
    const sisa = totalTagihan - totalTerbayar;
    
    return { total: totalTagihan, terbayar: totalTerbayar, sisa: Math.max(0, sisa), isLunas: sisa <= 0 };
  }, [data, s]);

  // Filter Logic
  const filteredTagihan = useMemo(() => {
    if (!data?.jenisTagihan) return [];

    return data.jenisTagihan.filter((jt: any) => {
      const terbayar = getTerbayarPerJenis(jt);
      const sisa = (Number(jt.nominal) || 0) - terbayar;
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
      iconHtml: `<div class="w-16 h-16 rounded-full bg-[#9B1C1C] flex items-center justify-center mx-auto"><span class="text-white text-3xl font-bold leading-none">!</span></div>`,
      title: "Hapus Data",
      html: `<p class="text-gray-500 text-sm text-center">Apakah Anda yakin ingin menghapus data ini?<br />Tindakan ini bersifat permanen.</p>`,
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
        confirmButton: "bg-[#9B1C1C] hover:bg-[#7f1616] text-white font-semibold px-8 py-3 rounded-full cursor-pointer",
        cancelButton: "border border-gray-300 text-gray-600 font-semibold px-8 py-3 rounded-full cursor-pointer",
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
            customClass: { confirmButton: "px-6 py-2 rounded-full font-bold" }
          });
          router.push("/client/admin/DaftarSiswa");
        } catch (error: any) {
          Swal.fire({ 
              title: "Gagal!", 
              text: error.response?.data?.error || "Terjadi kesalahan.", 
              icon: "error",
              confirmButtonColor: "#d33"
          });
        }
      }
    });
  };

  const handleExport = () => {
    if (!s || !data?.jenisTagihan) return;

    const headerInfo = [
      ["LAPORAN KEUANGAN SISWA"],
      [""],
      ["Nama Lengkap", ": " + s.nama_lengkap],
      ["NISN", ": " + (s.NISN || "-")],
      ["Status Siswa", ": " + (s.tipe_siswa || "-")],
      ["Tanggal Export", ": " + new Date().toLocaleDateString('id-ID')],
      [""],
      ["RINCIAN TAGIHAN"],
    ];

    const tableHeader = [
      ["No", "Nama Tagihan", "Total Tagihan (IDR)", "Sudah Terbayar (IDR)", "Sisa Tagihan (IDR)", "Status"]
    ];

    const tableRows = data.jenisTagihan.map((jt: any, index: number) => {
      const total = Number(jt.nominal) || 0;
      const terbayar = getTerbayarPerJenis(jt);
      const sisa = Math.max(0, total - terbayar);
      const status = sisa <= 0 ? "LUNAS" : "BELUM LUNAS";

      return [
        index + 1,
        jt.nama_pembayaran,
        total,
        terbayar,
        sisa,
        status
      ];
    });

    const totalSemuaTagihan = tableRows.reduce((acc: number, row: any) => acc + row[2], 0);
    const totalSemuaTerbayar = tableRows.reduce((acc: number, row: any) => acc + row[3], 0);
    const totalSemuaSisa = tableRows.reduce((acc: number, row: any) => acc + row[4], 0);

    const footerRow = [
      [""],
      ["TOTAL KESELURUHAN", "", totalSemuaTagihan, totalSemuaTerbayar, totalSemuaSisa, ""]
    ];

    const finalData = [...headerInfo, ...tableHeader, ...tableRows, ...footerRow];
    const ws = XLSX.utils.aoa_to_sheet(finalData);

    ws['!cols'] = [
      { wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");
    const cleanName = s.nama_lengkap.replace(/[^a-zA-Z0-9]/g, "_"); 
    XLSX.writeFile(wb, `Laporan_${s.NISN}_${cleanName}.xlsx`);
  };

  if (loading) {
    return <div className="ml-64 p-10 text-gray-400 font-medium tracking-tight">Memuat Detail...</div>;
  }

  return (
    <div className="ml-64 bg-gray-100 min-h-screen pb-10 px-5 pt-5 antialiased font-sans">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] text-gray-400 mb-5 font-medium tracking-wider">
        <span>Daftar Siswa</span> 
        <span className="text-gray-300">/</span> 
        <span className="text-[#068A50]">Detail Siswa</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-800 hover:opacity-70 transition-all cursor-pointer">
          <ChevronLeft size={20} className="text-gray-700" />
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Detail Siswa</h2>
        </button>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push(`/client/admin/DaftarSiswa/${id}/edit`)}
            className="px-5 py-2.5 bg-[#5BA47E] text-white rounded-[8px] text-[12px] font-semibold shadow-sm flex items-center gap-2 transition-all hover:bg-[#4a8a68] cursor-pointer"
          >
            <Edit size={14} /> Edit Detail
          </button>
          <button 
            onClick={handleDelete}
            className="px-5 py-2.5 bg-white border border-gray-200 text-red-500 rounded-[8px] text-[12px] font-semibold shadow-sm flex items-center gap-2 transition-all hover:bg-red-50 cursor-pointer"
          >
            <Trash2 size={14} /> Hapus
          </button>
        </div>
      </div>

      {/* Profile & NISN Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 bg-white p-8 rounded-[12px] shadow-sm border border-gray-100">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{s.nama_lengkap}</h3>
            <p className="text-[12px] text-gray-400 mt-1 uppercase tracking-widest">{s.email || "user@gmail.com"}</p>
          </div>
          <div className="grid grid-cols-4 gap-y-8 gap-x-4">
            <InfoItem label="Tempat, Tanggal Lahir" value={`${s.tempat_lahir}, ${new Date(s.tanggal_lahir).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`} />
            <InfoItem label="Jenis Kelamin" value={s.jenis_kelamin} />
            <InfoItem label="Anak ke" value={s.anak_ke} />
            <InfoItem label="Jumlah Saudara" value={s.jumlah_saudara} />
            <InfoItem label="Jalur Pendaftaran" value={<span className="capitalize">{s.jalur_pendaftaran?.replace(/_/g, ' ')}</span>} />
            <InfoItem label="No Hp" value={s.no_hp} />
            <InfoItem label="Ukuran Baju" value={s.ukuran_baju} />
            <InfoItem label="Alamat Lengkap" value={s.alamat || s.alamat_rumah} />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[12px] shadow-sm border border-gray-100">
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

      {/* Parent Info Card (FIXED DATE FORMAT) */}
      <div className="bg-white p-8 rounded-[12px] shadow-sm border border-gray-100 mb-5">
        <h3 className="text-[15px] font-bold text-gray-900 mb-8 tracking-tight uppercase tracking-widest">Data Orang Tua</h3>
        {ortu ? (
            <div className="grid grid-cols-5 gap-y-10 gap-x-4">
            <InfoItem label="Nama Ayah" value={ortu.nama_ayah} />
            
            {/* FIX FORMAT TANGGAL DI SINI */}
            <InfoItem 
                label="TTL Ayah" 
                value={ortu.tempat_lahir_ayah && ortu.tanggal_lahir_ayah 
                    ? `${ortu.tempat_lahir_ayah}, ${new Date(ortu.tanggal_lahir_ayah).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` 
                    : "-"} 
            />
            
            <InfoItem label="Pendidikan" value={ortu.pendidikan_ayah} />
            <InfoItem label="Pekerjaan" value={ortu.pekerjaan_ayah} />
            <InfoItem label="Penghasilan" value={ortu.penghasilan_ayah} />
            
            <InfoItem label="Nama Ibu" value={ortu.nama_ibu} />
            
            {/* FIX FORMAT TANGGAL DI SINI JUGA */}
            <InfoItem 
                label="TTL Ibu" 
                value={ortu.tempat_lahir_ibu && ortu.tanggal_lahir_ibu 
                    ? `${ortu.tempat_lahir_ibu}, ${new Date(ortu.tanggal_lahir_ibu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` 
                    : "-"} 
            />
            
            <InfoItem label="Pendidikan" value={ortu.pendidikan_ibu} />
            <InfoItem label="Pekerjaan" value={ortu.pekerjaan_ibu} />
            <InfoItem label="Penghasilan" value={ortu.penghasilan_ibu} />
            
            <InfoItem label="No Hp Orang Tua" value={ortu.no_hp_orang_tua} />
            </div>
        ) : (
            <p className="text-gray-400 text-sm italic">Data orang tua belum dilengkapi.</p>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-10 mb-5 border-b border-gray-100 px-2">
        {['Tagihan', 'Dokumen', 'Prestasi'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab.toLowerCase())} 
            className={`text-[12px] font-bold pb-4 transition-all cursor-pointer ${activeTab === tab.toLowerCase() ? 'border-b-2 border-[#068A50] text-gray-900' : 'text-gray-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ================= TAB TAGIHAN ================= */}
      {activeTab === 'tagihan' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <TagihanCard label="Total Tagihan" value={tagihanStats.total} />
            <TagihanCard label="Total Terbayar" value={tagihanStats.terbayar} />
            <TagihanCard label="Sisa Tagihan" value={tagihanStats.sisa} />
            <div className="bg-white p-6 rounded-[12px] border border-gray-100 shadow-sm flex flex-col gap-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status Pembayaran</p>
              <p className={`text-[17px] font-bold ${tagihanStats.isLunas ? 'text-green-600' : 'text-red-500'}`}>
                {tagihanStats.isLunas ? 'Lunas' : 'Belum Lunas'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-gray-50">
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari tagihan..." className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-[12px] w-64 focus:outline-none" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-500 font-bold focus:outline-none cursor-pointer">
                  <option value="all">Semua Status</option>
                  <option value="lunas">Lunas</option>
                  <option value="belum_lunas">Belum Lunas</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-500 font-bold shadow-sm hover:bg-gray-50 transition-all cursor-pointer">
                  <Download size={14}/> Export Data
                </button>
              </div>
            </div>
            
            <div className="min-h-[300px]">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr className="text-[10px] text-gray-400 font-bold border-b border-gray-50 tracking-widest">
                    <th className="px-8 py-5">Nama Tagihan</th>
                    <th className="px-8 py-5">Total</th>
                    <th className="px-8 py-5 text-center">Terbayar</th>
                    <th className="px-8 py-5 text-center">Sisa</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-center">Update</th>
                    <th className="px-8 py-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[#3b3b3b]">
                  {filteredTagihan.length > 0 ? (
                    filteredTagihan.map((jt: any, i: number) => {
                      const terbayar = getTerbayarPerJenis(jt);
                      const sisa = (Number(jt.nominal) || 0) - terbayar;
                      const isLunas = sisa <= 0;

                      return (
                        <tr key={i} className="hover:bg-gray-50/30 text-[11px] transition-all">
                          <td className="px-8 py-5 font-bold text-gray-700">{jt.nama_pembayaran}</td>
                          <td className="px-8 py-5 font-medium text-gray-500">IDR {(Number(jt.nominal) || 0).toLocaleString('id-ID')}</td>
                          <td className="px-8 py-5 text-center text-green-600 font-bold">IDR {terbayar.toLocaleString('id-ID')}</td>
                          <td className="px-8 py-5 text-center text-red-500 font-bold">IDR {Math.max(0, sisa).toLocaleString('id-ID')}</td>
                          <td className="px-8 py-5 text-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold whitespace-nowrap ${isLunas ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                              {isLunas ? 'Lunas' : 'Belum Lunas'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center text-gray-400 font-medium">{s.updated_at?.split('T')[0] || "-"}</td>
                          <td className="px-8 py-5 text-center">
                          <button 
                              onClick={() => router.push(`/client/admin/DaftarSiswa/riwayat-pembayaran-siswa/${id}?tagihan=${jt.id_jenis_pembayaran || jt.id}`)} 
                              className="p-2 hover:bg-green-50 rounded-full text-green-600 cursor-pointer"
                            >
                              <Info size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <EmptyState message="Data Tagihan tidak ditemukan" />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB DOKUMEN ================= */}
      {activeTab === 'dokumen' && (
        <div className="animate-in fade-in duration-300 bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 min-h-[400px]">
            <div className="flex justify-between mb-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" placeholder="Cari dokumen..." className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[12px] w-64 focus:outline-none" />
                </div>
                <button className="flex items-center gap-2 px-5 py-2 bg-[#068A50] text-white rounded-lg text-[11px] font-bold hover:opacity-90 transition-all cursor-pointer">
                  <Plus size={14}/> Tambah Dokumen
                </button>
            </div>

            {s.tb_dokumen && s.tb_dokumen.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {s.tb_dokumen.map((doc: any, i: number) => (
                    <div key={i} className="border border-gray-100 p-5 rounded-xl flex items-start gap-4 hover:shadow-md transition-all bg-gray-50/30">
                    <div className="bg-green-100 p-3 rounded-lg text-green-700">
                        <FileText size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[12px] font-bold text-gray-800 uppercase tracking-wide mb-1 line-clamp-1">
                            {doc.jenis_dokumen?.replace(/_/g, " ") || "Dokumen"}
                        </p>
                        <p className="text-[10px] text-gray-400 mb-3">
                            Diupload: {new Date(doc.uploaded_at).toLocaleDateString('id-ID')}
                        </p>
                        <a 
                            href={doc.file_path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-[#068A50] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            Lihat File <Eye size={12} />
                        </a>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <EmptyState message="Dokumen tidak tersedia" subMessage="Siswa belum mengupload dokumen apapun" type="grid" />
            )}
        </div>
      )}

      {/* ================= TAB PRESTASI ================= */}
      {activeTab === 'prestasi' && (
        <div className="animate-in fade-in duration-300 bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
           <div className="p-6 flex justify-between items-center border-b border-gray-50">
             {/* Kosong (bisa ditambah tombol jika mau) */}
           </div>

           {s.tb_prestasi && s.tb_prestasi.length > 0 ? (
             <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr className="text-[10px] text-gray-400 font-bold border-b border-gray-50 tracking-widest">
                    <th className="px-8 py-5">Nama Prestasi</th>
                    <th className="px-8 py-5">Jenis</th>
                    <th className="px-8 py-5">Tingkat</th>
                    <th className="px-8 py-5">Peringkat</th>
                    <th className="px-8 py-5">Tahun</th>
                    <th className="px-8 py-5">Penyelenggara</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[#3b3b3b]">
                    {s.tb_prestasi.map((p: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50/30 text-[11px] transition-all">
                            <td className="px-8 py-5 font-bold text-gray-700">
                                {p.nama_prestasi}
                            </td>
                            <td className="px-8 py-5 font-medium text-gray-500 capitalize">{p.jenis_prestasi?.replace(/_/g, ' ')}</td>
                            <td className="px-8 py-5">
                                <span className="text-[#068A50] font-bold bg-green-50 rounded-lg px-3 py-1 text-[10px] capitalize">
                                    {p.tingkat}
                                </span>
                            </td>
                            <td className="px-8 py-5 font-bold">{p.peringkat}</td>
                            <td className="px-8 py-5 text-gray-400 font-bold">{p.tahun}</td>
                            <td className="px-8 py-5 text-gray-600 font-medium">{p.penyelenggara}</td>
                        </tr>
                    ))}
                </tbody>
             </table>
           ) : (
             <EmptyState message="Data Prestasi tidak tersedia" subMessage="Siswa belum memiliki riwayat prestasi" />
           )}
        </div>
      )}

      <footer className="mt-10 text-[11px] text-gray-300 font-semibold text-center tracking-widest uppercase">© PERSIS 212 KUDANG</footer>
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
    <div className="bg-white p-6 rounded-[12px] border border-gray-100 shadow-sm flex flex-col gap-1">
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</span>
      <span className="text-[17px] font-bold text-gray-800 tracking-tight">IDR {value.toLocaleString('id-ID')}</span>
    </div>
  );
}

function EmptyState({ message, subMessage, type = 'table' }: { message: string, subMessage?: string, type?: 'table' | 'grid' }) {
    const content = (
        <div className="flex flex-col items-center justify-center gap-3 w-full">
            <div className="bg-gray-50 p-4 rounded-full">
               <FolderOpen size={40} className="text-gray-300" />
            </div>
            <div>
                <p className="text-gray-600 text-sm font-bold">{message}</p>
                {subMessage && <p className="text-gray-400 text-xs mt-1">{subMessage}</p>}
            </div>
        </div>
    );

    if (type === 'grid') {
        return (
            <div className="w-full py-20 flex justify-center col-span-1 md:col-span-3">
                {content}
            </div>
        );
    }

    return (
        <tr className="w-full">
            <td colSpan={7} className="py-20 text-center w-full">
                {content}
            </td>
        </tr>
    );
}