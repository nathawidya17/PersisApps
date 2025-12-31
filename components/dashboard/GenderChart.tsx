"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GenderChartProps {
  data: any[]; // Data dari prisma.tb_siswa.groupBy
  total: number; // Data dari prisma.tb_siswa.count()
}

export default function GenderChart({ data, total }: GenderChartProps) {
  // Mapping data prisma ke format Recharts
  const chartData = data.map((item) => ({
    name: item.jenis_kelamin,
    value: item._count
  }));

  const COLORS = ['#2D5A3F', '#FACC15'];

  return (
    <div className="relative w-full h-[250px] flex flex-col items-center">
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-2xl font-black text-gray-800">{total}</p>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total</p>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData.length > 0 ? chartData : [{ name: 'Empty', value: 1 }]}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="flex gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#2D5A3F]" />
          <span className="text-xs font-bold text-gray-600">Putra</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FACC15]" />
          <span className="text-xs font-bold text-gray-600">Putri</span>
        </div>
      </div>
    </div>
  );
}