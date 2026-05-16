import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isUserRole } from "@/lib/user-roles";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  imageUrl: true,
  isBlocked: true,
  blockedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO || session.user.isBlocked) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: [{ isBlocked: "asc" }, { createdAt: "desc" }],
    select: USER_SELECT,
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO || session.user.isBlocked) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = (await req.json()) as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const role = body.role ?? "";

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Nome, e-mail, senha e perfil são obrigatórios." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  if (!isUserRole(role)) {
    return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role,
      },
      select: USER_SELECT,
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "E-mail já cadastrado ou dados inválidos." }, { status: 400 });
  }
}
