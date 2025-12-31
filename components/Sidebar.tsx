export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#2D5A3F] text-white p-6 flex flex-col gap-8">
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 bg-yellow-500 rounded-full" />
        <div className="leading-tight">
          <p className="text-[10px] font-bold">PPDB</p>
          <p className="text-[10px] font-bold">PERSIS KUDANG</p>
        </div>
      </div>

      <nav className="space-y-2 text-[11px]">
        <div className="bg-white text-[#2D5A3F] p-3 rounded-lg font-bold flex items-center gap-3">
          <span>📊</span> Dashboard
        </div>
        <div className="p-3 hover:bg-white/10 rounded-lg flex items-center gap-3 transition cursor-pointer">
          <span>👥</span> Daftar Siswa
        </div>
        <div className="p-3 hover:bg-white/10 rounded-lg flex items-center gap-3 transition cursor-pointer">
          <span>📝</span> PPDB
        </div>
      </nav>
    </aside>
  );
}