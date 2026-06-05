import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type Params = { params: { id: string } };

const studentInclude = {
  class: { select: { id: true, name: true } },
  _count: { select: { occurrences: true } },
} as const;

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      ...studentInclude,
      occurrences: {
        orderBy: { occurredAt: "desc" },
        take: 15,
        select: {
          id: true,
          controlNumber: true,
          occurredAt: true,
          reason: true,
          schoolClass: { select: { name: true } },
        },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
  }

  return NextResponse.json(student);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = (await req.json()) as { classId?: string; name?: string; ra?: string };
  const classId = body.classId?.trim();
  const name = body.name?.trim();
  const ra = body.ra?.trim();

  if (!classId && !name && !ra) {
    return NextResponse.json({ error: "Informe ao menos um campo para atualizar." }, { status: 400 });
  }

  const current = await prisma.student.findUnique({
    where: { id: params.id },
    select: { id: true, classId: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
  }

  if (classId) {
    if (classId === current.classId) {
      return NextResponse.json({ error: "O aluno já está nesta turma." }, { status: 400 });
    }
    const turma = await prisma.schoolClass.findUnique({ where: { id: classId } });
    if (!turma) {
      return NextResponse.json({ error: "Turma de destino não encontrada." }, { status: 400 });
    }
  }

  try {
    const updated = await prisma.student.update({
      where: { id: params.id },
      data: {
        ...(classId ? { classId } : {}),
        ...(name ? { name } : {}),
        ...(ra ? { ra } : {}),
      },
      include: studentInclude,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar (RA duplicado?)." }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const count = await prisma.occurrence.count({ where: { studentId: params.id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "Não é possível excluir aluno com ocorrências vinculadas." },
      { status: 400 },
    );
  }

  await prisma.student.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
