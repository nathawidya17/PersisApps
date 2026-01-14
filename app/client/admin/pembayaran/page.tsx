"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Filter, Eye, Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PembayaranPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("/server/api/admin/pembayaran/group");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => 
    item.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nisn.includes(searchTerm)
  );

  if (loading) return <div className="ml-64 p-10 flex justify-center"><Loader2 className="animate-spin text-gray-400"/></div>;

  return (
    <div className="ml-64 bg-gray-100 min-h-screen p-8 font-sans">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Daftar Transaksi Masuk</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Tools */}
        <div className="p-5 border-b border-gray-50 flex justify-between">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16}/>
              <input 
                type="text" 
                placeholder="Cari Siswa / NISN..." 
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
             <Download size={16}/> Export Report
           </button>
        </div>

        {/* Table Content */}
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50">
             <tr className="border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <th className="py-4 px-6 text-left whitespace-nowrap">NISN</th>
              <th className="py-4 px-6 text-left whitespace-nowrap">Siswa</th>
              <th className="py-4 px-6 text-center whitespace-nowrap">Waktu Transaksi</th>
              <th className="py-4 px-6 text-center whitespace-nowrap">Jumlah Item</th>
              <th className="py-4 px-6 text-left whitespace-nowrap">Total Nominal</th>
              <th className="py-4 px-6 text-center whitespace-nowrap">Status</th>
              <th className="py-4 px-6 text-center whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-[12px] text-gray-600">
            {filteredData.map((item) => (
              <tr key={item.group_id} className="hover:bg-gray-50 transition-colors duration-200">
                {/* NISN */}
                <td className="py-4 px-6 font-medium text-gray-500 font-mono">
                  {item.nisn}
                </td>
                
                {/* Siswa */}
                <td className="py-4 px-6 font-normal ">
                  {item.nama_siswa}
                </td>

                {/* Waktu */}
                <td className="py-4 px-6 text-center">
                  {new Date(item.date).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}
                </td>

                {/* Jumlah Item */}
                <td className="py-4 px-6 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600">
                    {item.jumlah_item} Item
                  </span>
                </td>

                {/* Total Nominal */}
                <td className="py-4 px-6 font-normal text-left">
                  IDR {item.total_nominal.toLocaleString('id-ID')}
                </td>

                {/* Status */}
                <td className="py-4 px-6 text-center">
                   <StatusBadge status={item.status} />
                </td>

                {/* Aksi */}
                <td className="py-4 px-6 text-center">
                  <button 
                    onClick={() => router.push(`/client/admin/pembayaran/${item.nisn}?date=${item.date}`)}
                    className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                    title="Lihat Detail Transaksi"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    'Need Approval': 'bg-yellow-50 text-yellow-600',
    'Approved': 'bg-green-50 text-green-600',
    'Rejected': 'bg-red-50 text-red-600',
    'Menunggu': 'bg-gray-50 text-gray-500'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${styles[status] || styles['Menunggu']}`}>
      {status}
    </span>
  );
}