import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = (await req.json()) as { classId?: string; name?: string; ra?: string };

  try {
    const updated = await prisma.student.update({
      where: { id: params.id },
      data: {
        ...(body.classId ? { classId: body.classId } : {}),
        ...(body.name?.trim() ? { name: body.name.trim() } : {}),
        ...(body.ra?.trim() ? { ra: body.ra.trim() } : {}),
      },
      include: { class: { select: { name: true } } },
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
