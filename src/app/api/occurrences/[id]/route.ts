import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const row = await prisma.occurrence.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      schoolClass: true,
      student: true,
      attachments: true,
    },
  });

  if (!row) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  if (session.user.role === UserRole.PROFESSOR && row.authorId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Somente a gestão pode atualizar esta ocorrência." }, { status: 403 });
  }

  const body = (await req.json()) as {
    parentName?: string | null;
    parentPhone?: string | null;
    parentEmail?: string | null;
    actionTaken?: string | null;
  };

  const data = {
    parentName: body.parentName?.trim() || null,
    parentPhone: body.parentPhone?.trim() || null,
    parentEmail: body.parentEmail?.trim() || null,
    actionTaken: body.actionTaken?.trim() || null,
  };

  const updated = await prisma.occurrence.update({
    where: { id: params.id },
    data,
    include: {
      author: { select: { name: true, email: true } },
      schoolClass: true,
      student: true,
      attachments: true,
    },
  });

  return NextResponse.json(updated);
}
