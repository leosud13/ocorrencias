import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { rm } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  canContributeToOccurrence,
  canDeleteOccurrence,
  canManageOccurrenceTratativa,
  canViewOccurrence,
} from "@/lib/occurrence-access";
import { dateTimeInputBRToISOString } from "@/lib/date-time";
import {
  hasActionTaken,
  notifyOccurrenceActionTaken,
} from "@/lib/occurrence-notifications";

type Params = { params: { id: string } };

const occurrenceInclude = {
  author: { select: { id: true, name: true, email: true, role: true } },
  schoolClass: true,
  student: true,
  attachments: { orderBy: { createdAt: "asc" as const } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: { name: true, role: true } } },
  },
};

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const row = await prisma.occurrence.findUnique({
    where: { id: params.id },
    include: occurrenceInclude,
  });

  if (!row) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  if (!canViewOccurrence(session.user, row)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const existing = await prisma.occurrence.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true, controlNumber: true, actionTaken: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  const body = (await req.json()) as {
    parentName?: string | null;
    parentPhone?: string | null;
    parentEmail?: string | null;
    actionTaken?: string | null;
    registeredAt?: string | null;
  };

  const data: Prisma.OccurrenceUpdateInput = {};
  const hasTratativa =
    body.parentName !== undefined ||
    body.parentPhone !== undefined ||
    body.parentEmail !== undefined ||
    body.actionTaken !== undefined;
  const hasRegisteredAt = body.registeredAt !== undefined;

  if (hasRegisteredAt) {
    if (!canContributeToOccurrence(session.user, existing)) {
      return NextResponse.json(
        { error: "Sem permissão para alterar a data de registro." },
        { status: 403 },
      );
    }

    const value = body.registeredAt?.trim();
    if (!value) {
      return NextResponse.json({ error: "Informe a data de registro." }, { status: 400 });
    }

    const registeredAt = new Date(dateTimeInputBRToISOString(value));
    if (Number.isNaN(registeredAt.getTime())) {
      return NextResponse.json({ error: "Data de registro inválida." }, { status: 400 });
    }

    data.registeredAt = registeredAt;
  }

  if (hasTratativa) {
    if (!canManageOccurrenceTratativa(session.user)) {
      return NextResponse.json(
        { error: "Somente a gestão pode atualizar a tratativa." },
        { status: 403 },
      );
    }

    data.parentName = body.parentName?.trim() || null;
    data.parentPhone = body.parentPhone?.trim() || null;
    data.parentEmail = body.parentEmail?.trim() || null;
    data.actionTaken = body.actionTaken?.trim() || null;
  }

  if (!hasRegisteredAt && !hasTratativa) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
  }

  const nextActionTaken =
    body.actionTaken !== undefined ? body.actionTaken?.trim() || null : null;
  const shouldNotifyActionTaken =
    body.actionTaken !== undefined &&
    hasActionTaken(nextActionTaken) &&
    nextActionTaken !== (existing.actionTaken?.trim() || "");

  const updated = await prisma.occurrence.update({
    where: { id: params.id },
    data,
    include: occurrenceInclude,
  });

  if (shouldNotifyActionTaken) {
    await notifyOccurrenceActionTaken({
      authorId: existing.authorId,
      actorId: session.user.id,
      occurrenceId: existing.id,
      controlNumber: existing.controlNumber,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!canDeleteOccurrence(session.user)) {
    return NextResponse.json(
      { error: "Somente a gestão pode excluir ocorrências." },
      { status: 403 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const password = body.password?.trim() ?? "";
  if (!password) {
    return NextResponse.json(
      { error: "Informe sua senha para confirmar a exclusão." },
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

  const existing = await prisma.occurrence.findUnique({
    where: { id: params.id },
    select: { id: true, controlNumber: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  await prisma.occurrence.delete({ where: { id: existing.id } });

  try {
    await rm(path.join(process.cwd(), "uploads", existing.id), {
      recursive: true,
      force: true,
    });
  } catch {
    // Arquivos locais podem não existir em ambientes serverless.
  }

  return NextResponse.json({
    ok: true,
    controlNumber: existing.controlNumber,
  });
}
