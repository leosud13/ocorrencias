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

  const body = (await req.json()) as { name?: string };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  }

  const updated = await prisma.schoolClass.update({
    where: { id: params.id },
    data: { name },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const counts = await prisma.schoolClass.findUnique({
    where: { id: params.id },
    select: {
      _count: { select: { students: true, occurrences: true } },
    },
  });

  if (!counts) {
    return NextResponse.json({ error: "Turma não encontrada." }, { status: 404 });
  }

  if (counts._count.students > 0 || counts._count.occurrences > 0) {
    return NextResponse.json(
      {
        error:
          "Não é possível excluir turma com alunos vinculados ou ocorrências registradas. Reatribua os alunos ou arquive as ocorrências antes.",
      },
      { status: 400 },
    );
  }

  await prisma.schoolClass.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
