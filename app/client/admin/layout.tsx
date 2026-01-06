// app/admin/layout.tsx
import Sidebar from "@/components/admin/Sidebar"
import Navbar from "@/components/admin/Navbar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="">
      <Sidebar />

      <div className="flex-1">
        <Navbar />
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}
