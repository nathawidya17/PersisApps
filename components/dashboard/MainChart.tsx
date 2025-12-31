"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const dummyData = [
  { name: 'Senin', pendaftar: 52, calon: 25 },
  { name: 'Selasa', pendaftar: 35, calon: 30 },
  { name: 'Rabu', pendaftar: 55, calon: 70 },
  { name: 'Kamis', pendaftar: 25, calon: 35 },
  { name: 'Jumat', pendaftar: 15, calon: 60 },
  { name: 'Sabtu', pendaftar: 65, calon: 30 },
  { name: 'Minggu', pendaftar: 70, calon: 68 },
];

export default function MainChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dummyData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 12, fill: '#9ca3af'}} 
          />
          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          <Line 
            type="monotone" 
            dataKey="pendaftar" 
            stroke="#2D5A3F" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#2D5A3F' }} 
            activeDot={{ r: 6 }} 
          />
          <Line 
            type="monotone" 
            dataKey="calon" 
            stroke="#FACC15" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#FACC15' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}