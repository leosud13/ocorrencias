import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fileToProfileImageDataUrl } from "@/lib/profile-image";
import { getSession } from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.isBlocked) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.isBlocked) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const removePhoto = String(form.get("removePhoto") ?? "") === "true";
  const photo = form.get("photo");

  if (!name || !email) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  if (password && password.length < 6) {
    return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  let imageUrl: string | null | undefined;
  if (removePhoto) {
    imageUrl = null;
  } else if (photo instanceof File && photo.size > 0) {
    try {
      imageUrl = await fileToProfileImageDataUrl(photo);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Foto inválida." },
        { status: 400 },
      );
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
      },
      select: { id: true, email: true, name: true, role: true, imageUrl: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "E-mail já cadastrado ou dados inválidos." }, { status: 400 });
  }
}
