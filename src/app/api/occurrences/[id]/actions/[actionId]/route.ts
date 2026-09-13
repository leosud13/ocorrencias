import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canManageOccurrenceTratativa } from "@/lib/occurrence-access";
import { updateOccurrenceActionContent } from "@/lib/occurrence-actions";

type Params = { params: { id: string; actionId: string } };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!canManageOccurrenceTratativa(session.user)) {
    return NextResponse.json(
      { error: "Somente a gestão pode editar ações." },
      { status: 403 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    content?: string;
    password?: string;
  };
  const password = body.password?.trim() ?? "";
  if (!password) {
    return NextResponse.json(
      { error: "Informe sua senha para confirmar a edição." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true, isBlocked: true },
  });
  if (!user || user.isBlocked) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const existing = await prisma.occurrenceAction.findFirst({
    where: { id: params.actionId, occurrenceId: params.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Ação não encontrada." }, { status: 404 });
  }

  try {
    const updated = await updateOccurrenceActionContent({
      actionId: existing.id,
      actorId: session.user.id,
      content: body.content ?? "",
    });
    return NextResponse.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao editar ação.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
