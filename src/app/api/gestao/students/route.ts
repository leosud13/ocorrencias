import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const students = await prisma.student.findMany({
    where: classId ? { classId } : undefined,
    orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
    include: {
      class: { select: { id: true, name: true } },
      _count: { select: { occurrences: true } },
    },
  });

  return NextResponse.json(students);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = (await req.json()) as { classId?: string; name?: string; ra?: string };
  const classId = body.classId?.trim();
  const name = body.name?.trim();
  const ra = body.ra?.trim();

  if (!classId || !name || !ra) {
    return NextResponse.json(
      { error: "Classe (turma), nome e RA são obrigatórios." },
      { status: 400 },
    );
  }

  const turma = await prisma.schoolClass.findUnique({ where: { id: classId } });
  if (!turma) {
    return NextResponse.json({ error: "Turma não encontrada." }, { status: 400 });
  }

  try {
    const student = await prisma.student.create({
      data: { classId, name, ra },
      include: { class: { select: { name: true } } },
    });
    return NextResponse.json(student, { status: 201 });
  } catch {
    return NextResponse.json({ error: "RA já cadastrado ou dados inválidos." }, { status: 400 });
  }
}
