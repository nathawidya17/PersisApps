// app/layout.tsx
import './globals.css' // Pastikan baris ini ada!
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <div className="flex">
          <Sidebar />
          <div className="flex-1">
            <Navbar />
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}