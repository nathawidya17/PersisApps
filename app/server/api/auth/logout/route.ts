import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  // Hapus cookie admin_token
  cookieStore.delete("admin_token");
  
  return NextResponse.json({ message: "Logout berhasil" });
}