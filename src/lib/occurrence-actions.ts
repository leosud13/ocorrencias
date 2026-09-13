import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  hasActionTaken,
  notifyOccurrenceActionTaken,
} from "@/lib/occurrence-notifications";

export const occurrenceActionInclude = {
  author: { select: { id: true, name: true } },
  lastEditedBy: { select: { id: true, name: true } },
} as const;

export type OccurrenceActionWithUsers = Prisma.OccurrenceActionGetPayload<{
  include: typeof occurrenceActionInclude;
}>;

async function syncLatestActionTaken(
  tx: Prisma.TransactionClient,
  occurrenceId: string,
) {
  const latest = await tx.occurrenceAction.findFirst({
    where: { occurrenceId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { content: true },
  });

  await tx.occurrence.update({
    where: { id: occurrenceId },
    data: { actionTaken: latest?.content ?? null },
  });
}

export async function appendOccurrenceAction(params: {
  occurrenceId: string;
  actorId: string;
  content: string;
  notify?: boolean;
}) {
  const content = params.content.trim();
  if (!hasActionTaken(content)) {
    throw new Error("Informe a ação tomada.");
  }

  const occurrence = await prisma.occurrence.findUnique({
    where: { id: params.occurrenceId },
    select: { id: true, authorId: true, controlNumber: true },
  });
  if (!occurrence) {
    throw new Error("Ocorrência não encontrada.");
  }

  const action = await prisma.$transaction(async (tx) => {
    const created = await tx.occurrenceAction.create({
      data: {
        occurrenceId: occurrence.id,
        authorId: params.actorId,
        content,
      },
      include: occurrenceActionInclude,
    });
    await syncLatestActionTaken(tx, occurrence.id);
    return created;
  });

  if (params.notify !== false) {
    await notifyOccurrenceActionTaken({
      authorId: occurrence.authorId,
      actorId: params.actorId,
      occurrenceId: occurrence.id,
      controlNumber: occurrence.controlNumber,
    });
  }

  return action;
}

export async function updateOccurrenceActionContent(params: {
  actionId: string;
  actorId: string;
  content: string;
}) {
  const content = params.content.trim();
  if (!hasActionTaken(content)) {
    throw new Error("Informe a ação tomada.");
  }

  const existing = await prisma.occurrenceAction.findUnique({
    where: { id: params.actionId },
    select: {
      id: true,
      occurrenceId: true,
      content: true,
      occurrence: {
        select: { id: true, authorId: true, controlNumber: true },
      },
    },
  });
  if (!existing) {
    throw new Error("Ação não encontrada.");
  }

  if (existing.content.trim() === content) {
    return prisma.occurrenceAction.findUniqueOrThrow({
      where: { id: existing.id },
      include: occurrenceActionInclude,
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.occurrenceAction.update({
      where: { id: existing.id },
      data: {
        content,
        lastEditedById: params.actorId,
      },
      include: occurrenceActionInclude,
    });
    await syncLatestActionTaken(tx, existing.occurrenceId);
    return row;
  });

  await notifyOccurrenceActionTaken({
    authorId: existing.occurrence.authorId,
    actorId: params.actorId,
    occurrenceId: existing.occurrence.id,
    controlNumber: existing.occurrence.controlNumber,
  });

  return updated;
}

export async function appendOccurrenceActionsBatch(params: {
  occurrenceIds: string[];
  actorId: string;
  content: string;
}) {
  const content = params.content.trim();
  if (!hasActionTaken(content)) {
    throw new Error("Informe a ação tomada.");
  }
  if (params.occurrenceIds.length === 0) {
    throw new Error("Selecione ao menos uma ocorrência.");
  }

  const rows = await prisma.occurrence.findMany({
    where: { id: { in: params.occurrenceIds } },
    select: { id: true, authorId: true, controlNumber: true, studentId: true },
  });

  if (rows.length !== params.occurrenceIds.length) {
    throw new Error("Uma ou mais ocorrências não foram encontradas.");
  }

  const studentIds = new Set(rows.map((r) => r.studentId));
  if (studentIds.size !== 1) {
    throw new Error("Selecione apenas ocorrências do mesmo aluno.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.occurrenceAction.createMany({
      data: rows.map((row) => ({
        occurrenceId: row.id,
        authorId: params.actorId,
        content,
      })),
    });

    for (const row of rows) {
      await syncLatestActionTaken(tx, row.id);
    }
  });

  for (const row of rows) {
    await notifyOccurrenceActionTaken({
      authorId: row.authorId,
      actorId: params.actorId,
      occurrenceId: row.id,
      controlNumber: row.controlNumber,
    });
  }

  return { updated: rows.length, studentId: rows[0]?.studentId ?? null };
}
