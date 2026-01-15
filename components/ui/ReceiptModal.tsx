"use client";

import React, { useRef } from "react";
import { X, Printer } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    id_transaksi: string | number;
    nama_siswa: string;
    nisn: string;
    tipe_pembayaran: string; 
    nominal: number;
    tanggal: string | Date;
    status: string;
    operator?: string; 
  };
}

export default function ReceiptModal({ isOpen, onClose, data }: ReceiptModalProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Format Rupiah
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  // Format Tanggal & Jam
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      
      {/* Wrapper agar tombol close tidak ikut ter-print */}
      <div className="relative flex flex-col items-center">
        
        {/* Tombol Action (Hilang saat Print) */}
        <div className="flex gap-2 mb-4 print:hidden animate-in fade-in slide-in-from-bottom-2">
            <button onClick={handlePrint} className="bg-white text-gray-800 px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-gray-50 transition-all cursor-pointer">
                <Printer size={16} /> Cetak
            </button>
            <button onClick={onClose} className="bg-white text-gray-800 w-10 h-10 rounded-full font-bold shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer">
                <X size={20} />
            </button>
        </div>

        {/* --- KERTAS STRUK --- */}
        <div id="receipt-print-area" className="w-[350px] bg-white shadow-2xl overflow-hidden relative font-mono text-gray-800">
          
          {/* Efek Bergerigi Atas */}
          <div className="w-full h-4 bg-white relative -top-2" style={{
              backgroundImage: "radial-gradient(circle, transparent 50%, white 50%)",
              backgroundSize: "10px 10px",
              backgroundPosition: "0 5px"
          }}></div>

          <div className="px-8 py-6">
            
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black tracking-tighter uppercase mb-1">MA PERSIS KUDANG</h2>
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Kudang - Garut</p>
              <p className="text-[10px] text-gray-400 mt-1">{formatDate(data.tanggal)}</p>
            </div>

            {/* Nomor Referensi Box */}
            <div className="border-2 border-dashed border-gray-300 p-3 text-center mb-6 rounded-lg">
                <p className="text-[10px] uppercase text-gray-400 mb-1">ID Transaksi</p>
                <p className="text-lg font-bold tracking-widest">{data.id_transaksi}</p>
            </div>

            {/* Detail Siswa */}
            <div className="space-y-1 mb-4 text-[11px] uppercase border-b border-dashed border-gray-300 pb-4">
                <div className="flex justify-between">
                    <span className="text-gray-500">Siswa</span>
                    <span className="font-bold text-right w-1/2 truncate">{data.nama_siswa}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">NISN</span>
                    <span className="font-bold">{data.nisn}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-500">Metode</span>
                    <span className="font-bold">CASH (TUNAI)</span>
                </div>
            </div>

            {/* Rincian Item */}
            <div className="mb-4 text-[12px]">
                <div className="flex justify-between font-bold mb-2">
                    <span>ITEM</span>
                    <span>HARGA</span>
                </div>
                {/* Item List */}
                <div className="flex justify-between items-start mb-2">
                    <span className="uppercase w-2/3">{data.tipe_pembayaran}</span>
                    <span className="font-mono">{formatIDR(data.nominal)}</span>
                </div>
                 <div className="flex justify-between items-start text-gray-400 text-[10px]">
                    <span className="uppercase">Biaya Admin</span>
                    <span className="font-mono">Rp 0</span>
                </div>
            </div>

            {/* Total Section */}
            <div className="border-t-2 border-dashed border-gray-800 pt-4 mb-8">
                <div className="flex justify-between items-end">
                    <span className="font-bold text-xl">TOTAL</span>
                    <span className="font-black text-2xl">{formatIDR(data.nominal)}</span>
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-500 uppercase">Status</span>
                    <span className="text-[10px] font-bold uppercase bg-black text-white px-2 py-0.5 rounded-sm">
                        {data.status === 'lunas' ? 'LUNAS' : data.status}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-gray-400 uppercase leading-relaxed">
                <p>Operator: {data.operator || "System"}</p>
                <p className="mt-2">Simpan struk ini sebagai<br/>bukti pembayaran yang sah.</p>
                <h3 className="text-lg font-black text-gray-800 mt-4 italic">TERIMA KASIH</h3>
            </div>

          </div>

          {/* Efek Bergerigi Bawah */}
          <div className="w-full h-4 bg-white relative top-2" style={{
              backgroundImage: "radial-gradient(circle, transparent 50%, white 50%)",
              backgroundSize: "10px 10px",
              backgroundPosition: "0 5px"
          }}></div>
          
        </div>
      </div>

      {/* --- CSS KHUSUS PRINT --- */}
      <style jsx global>{`
        @media print {
          /* 1. Sembunyikan Body Utama */
          body * {
            visibility: hidden;
          }

          /* 2. TAMPILKAN HANYA RECEIPT DAN ISI DALAMNYA */
          #receipt-print-area, #receipt-print-area * {
            visibility: visible;
          }

          /* 3. SETTING POSISI AGAR PAS DI KERTAS A4/Thermal */
          #receipt-print-area {
            position: fixed !important; /* Pakai fixed biar lepas dari parent flow */
            top: 20px !important;       /* Jarak dari atas kertas */
            left: 50% !important;       /* Posisikan di tengah horizontal */
            transform: translateX(-50%) !important; /* Center alignment */
            
            width: 350px !important;    /* Paksa lebar tetap */
            margin: 0 !important;
            padding: 0 !important;
            
            /* PENTING: Paksa Background Putih & Teks Hitam */
            background-color: white !important;
            color: black !important;
            box-shadow: none !important;
            
            /* Hindari kepotong halaman */
            page-break-inside: avoid;
            break-inside: avoid;
            
            z-index: 999999999;
          }

          /* 4. Reset Margin Browser */
          @page {
            size: auto;
            margin: 0mm;
          }
          
          /* 5. Pastikan Body Putih */
          body {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  );
}