import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (pathname.startsWith("/login")) {
    if (token?.role === UserRole.GESTAO) {
      return NextResponse.redirect(new URL("/gestao", req.url));
    }
    if (token?.role === UserRole.PROFESSOR) {
      return NextResponse.redirect(new URL("/professor/ocorrencias", req.url));
    }
    if (token?.role === UserRole.AGENTE_ESCOLAR) {
      return NextResponse.redirect(new URL("/professor/ocorrencias", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/perfil")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/professor")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.role !== UserRole.PROFESSOR && token.role !== UserRole.AGENTE_ESCOLAR) {
      return NextResponse.redirect(new URL("/gestao", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/gestao")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.role !== UserRole.GESTAO) {
      return NextResponse.redirect(new URL("/professor/ocorrencias", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/professor/:path*", "/gestao/:path*", "/perfil/:path*", "/login"],
};
