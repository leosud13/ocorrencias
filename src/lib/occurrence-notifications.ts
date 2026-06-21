import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function notifyOccurrenceActionTaken(params: {
  authorId: string;
  actorId: string;
  occurrenceId: string;
  controlNumber: string;
}) {
  const { authorId, actorId, occurrenceId, controlNumber } = params;
  if (authorId === actorId) return;

  await prisma.notification.create({
    data: {
      userId: authorId,
      occurrenceId,
      type: NotificationType.OCCURRENCE_ACTION_TAKEN,
      title: "Tratativa registrada",
      message: `A gestão registrou uma ação na ocorrência ${controlNumber}.`,
    },
  });
}

export function hasActionTaken(value: string | null | undefined): boolean {
  return !!(value && value.trim());
}
