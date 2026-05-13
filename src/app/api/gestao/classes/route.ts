import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const classes = await prisma.schoolClass.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { students: true, occurrences: true } },
    },
  });

  return NextResponse.json(classes);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = (await req.json()) as { name?: string };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Nome da turma é obrigatório." }, { status: 400 });
  }

  const created = await prisma.schoolClass.create({ data: { name } });
  return NextResponse.json(created, { status: 201 });
}
