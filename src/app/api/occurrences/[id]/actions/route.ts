import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canManageOccurrenceTratativa, canViewOccurrence } from "@/lib/occurrence-access";
import {
  appendOccurrenceAction,
  occurrenceActionInclude,
} from "@/lib/occurrence-actions";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const occurrence = await prisma.occurrence.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true },
  });
  if (!occurrence) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }
  if (!canViewOccurrence(session.user, occurrence)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const actions = await prisma.occurrenceAction.findMany({
    where: { occurrenceId: occurrence.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: occurrenceActionInclude,
  });

  return NextResponse.json(actions);
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!canManageOccurrenceTratativa(session.user)) {
    return NextResponse.json(
      { error: "Somente a gestão pode registrar ações." },
      { status: 403 },
    );
  }

  const occurrence = await prisma.occurrence.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!occurrence) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as { content?: string };
  try {
    const action = await appendOccurrenceAction({
      occurrenceId: occurrence.id,
      actorId: session.user.id,
      content: body.content ?? "",
    });
    return NextResponse.json(action, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar ação.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
