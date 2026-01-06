// app/layout.tsx
import './globals.css' // Pastikan baris ini ada!


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="flex">
          <div className="flex-1">
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}