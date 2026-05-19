import { Prisma } from "@prisma/client";
import { dateRangeToBrasiliaUtc } from "@/lib/date-time";

export type OccurrenceListFilters = {
  from?: string | null;
  to?: string | null;
  studentId?: string | null;
};

export function parseOccurrenceListFilters(
  searchParams: URLSearchParams,
): OccurrenceListFilters {
  return {
    from: searchParams.get("from")?.trim() || null,
    to: searchParams.get("to")?.trim() || null,
    studentId: searchParams.get("studentId")?.trim() || null,
  };
}

export function buildOccurrenceListWhere(
  filters: OccurrenceListFilters,
): Prisma.OccurrenceWhereInput {
  const where: Prisma.OccurrenceWhereInput = {};
  const { from, to, studentId } = filters;

  if (from && to) {
    where.occurredAt = dateRangeToBrasiliaUtc(from, to);
  } else if (from || to) {
    throw new Error("Informe data inicial e final para filtrar por período.");
  }

  if (studentId) where.studentId = studentId;

  return where;
}
