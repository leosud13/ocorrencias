import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getSession } from "@/lib/session";
import { appendOccurrenceActionsBatch } from "@/lib/occurrence-actions";

const MAX_IDS = 200;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    ids?: string[];
    actionTaken?: string;
  };

  const ids = Array.from(
    new Set((body.ids ?? []).map((id) => String(id).trim()).filter(Boolean)),
  );
  if (ids.length === 0) {
    return NextResponse.json({ error: "Selecione ao menos uma ocorrência." }, { status: 400 });
  }
  if (ids.length > MAX_IDS) {
    return NextResponse.json(
      { error: `Selecione no máximo ${MAX_IDS} ocorrências por vez.` },
      { status: 400 },
    );
  }

  try {
    const result = await appendOccurrenceActionsBatch({
      occurrenceIds: ids,
      actorId: session.user.id,
      content: body.actionTaken ?? "",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao registrar ações.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
