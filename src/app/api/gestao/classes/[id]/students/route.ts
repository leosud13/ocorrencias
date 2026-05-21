import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const turma = await prisma.schoolClass.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      _count: { select: { students: true } },
    },
  });

  if (!turma) {
    return NextResponse.json({ error: "Turma não encontrada." }, { status: 404 });
  }

  if (turma._count.students === 0) {
    return NextResponse.json({
      ok: true,
      deleted: 0,
      skipped: 0,
      turma: turma.name,
    });
  }

  const skipped = await prisma.student.count({
    where: { classId: turma.id, occurrences: { some: {} } },
  });

  const result = await prisma.student.deleteMany({
    where: { classId: turma.id, occurrences: { none: {} } },
  });

  return NextResponse.json({
    ok: true,
    deleted: result.count,
    skipped,
    turma: turma.name,
  });
}
