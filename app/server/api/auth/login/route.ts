import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.tb_users.findUnique({ 
      where: { email: email } 
    });

    if (!user) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    // Buat JWT Token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-kudang-212');
    const token = await new SignJWT({ id: user.id_user, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 // 1 hari
    });

    return NextResponse.json({ message: "Login Berhasil" });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}