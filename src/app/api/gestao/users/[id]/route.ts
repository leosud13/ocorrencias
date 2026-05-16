import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isUserRole } from "@/lib/user-roles";

type Params = { params: { id: string } };

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

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO || session.user.isBlocked) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = (await req.json()) as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    isBlocked?: boolean;
  };

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const role = body.role ?? "";
  const password = body.password ?? "";
  const isBlocked = Boolean(body.isBlocked);

  if (!name || !email || !role) {
    return NextResponse.json({ error: "Nome, e-mail e perfil são obrigatórios." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  if (!isUserRole(role)) {
    return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  }

  if (password && password.length < 6) {
    return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  if (params.id === session.user.id && isBlocked) {
    return NextResponse.json({ error: "Você não pode bloquear o próprio usuário." }, { status: 400 });
  }

  const current = await prisma.user.findUnique({
    where: { id: params.id },
    select: { isBlocked: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        email,
        role,
        isBlocked,
        blockedAt: isBlocked ? current.isBlocked ? undefined : new Date() : null,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
      select: USER_SELECT,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "E-mail já cadastrado ou dados inválidos." }, { status: 400 });
  }
}
