
export default function DataTable({ title, data, type }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <h4 className="text-[11px] font-bold text-gray-700 mb-4 uppercase tracking-wider">{title}</h4>
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] text-gray-400 border-b border-gray-50 uppercase">
            {type === 'transaction' ? (
              <><th className="pb-2">Nominal</th><th className="pb-2">Metode</th><th className="pb-2">Penerima</th></>
            ) : (
              <><th className="pb-2">No Pendaftaran</th><th className="pb-2">Nama</th><th className="pb-2">JK</th></>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((item: any, i: number) => (
            <tr key={i} className="text-[10px] text-gray-600">
              <td className="py-3 font-medium">
                {type === 'transaction' ? `IDR ${item.nominal?.toLocaleString()}` : item.no_pendaftaran}
              </td>
              <td className="py-3">{type === 'transaction' ? item.metode_bayar : item.nama_siswa}</td>
              <td className="py-3">{type === 'transaction' ? item.penerima : item.jenis_kelamin}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}