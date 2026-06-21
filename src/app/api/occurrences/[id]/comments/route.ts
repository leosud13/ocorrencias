import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canContributeToOccurrence } from "@/lib/occurrence-access";

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const occurrence = await prisma.occurrence.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true },
  });

  if (!occurrence) {
    return NextResponse.json({ error: "Ocorrência não encontrada." }, { status: 404 });
  }

  if (!canContributeToOccurrence(session.user, occurrence)) {
    return NextResponse.json({ error: "Sem permissão para comentar nesta ocorrência." }, { status: 403 });
  }

  const body = (await req.json()) as { content?: string };
  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "Informe o comentário." }, { status: 400 });
  }

  const comment = await prisma.occurrenceComment.create({
    data: {
      occurrenceId: occurrence.id,
      authorId: session.user.id,
      content,
    },
    include: {
      author: { select: { name: true, role: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
