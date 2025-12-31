"use client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

export default function RevenueSection() {
  // Angka ini nantinya ditarik dari props hasil query aggregate prisma
  const totalMasuk = 80000000;
  const totalPendaftaran = 20000000;
  const totalDaftarUlang = 60000000;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-[#2D5A3F] font-bold text-sm mb-6">Uang Masuk PPDB</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 bg-gray-50/50">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600">💰</div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Uang Masuk</p>
            <p className="text-sm font-bold">IDR {totalMasuk.toLocaleString('id-ID')}.00</p>
          </div>
        </div>
        {/* Render 2 Card lainnya mirip di atas */}
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dummyBarData}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
            <Tooltip />
            <Bar dataKey="pendaftaran" fill="#2D5A3F" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ulang" fill="#FACC15" radius={[4, 4, 0, 0]}>
               {/* Logika highlight warna ungu seperti di gambar bisa ditaruh di sini */}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}