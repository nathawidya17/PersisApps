import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;

  // Proteksi folder admin
  if (request.nextUrl.pathname.startsWith('/client/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/client/auth/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-kudang-212');
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (err) {
      // Jika token tidak valid, arahkan balik ke login
      return NextResponse.redirect(new URL('/client/auth/login', request.url));
    }
  }
  return NextResponse.next();
}