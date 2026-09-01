import { Prisma } from "@prisma/client";
import { dateRangeToBrasiliaUtc } from "@/lib/date-time";

export type OccurrenceStatusFilter = "pendente" | "com_acao";

export type OccurrenceListFilters = {
  from?: string | null;
  to?: string | null;
  q?: string | null;
  studentId?: string | null;
  classId?: string | null;
  status?: OccurrenceStatusFilter | null;
};

export function parseOccurrenceListFilters(
  searchParams: URLSearchParams,
): OccurrenceListFilters {
  const statusRaw = searchParams.get("status")?.trim();
  const status =
    statusRaw === "pendente" || statusRaw === "com_acao" ? statusRaw : null;

  return {
    from: searchParams.get("from")?.trim() || null,
    to: searchParams.get("to")?.trim() || null,
    q: searchParams.get("q")?.trim() || null,
    studentId: searchParams.get("studentId")?.trim() || null,
    classId: searchParams.get("classId")?.trim() || null,
    status,
  };
}

export function buildOccurrenceListWhere(
  filters: OccurrenceListFilters,
): Prisma.OccurrenceWhereInput {
  const and: Prisma.OccurrenceWhereInput[] = [];
  const { from, to, q, studentId, classId, status } = filters;

  if (from && to) {
    and.push({ occurredAt: dateRangeToBrasiliaUtc(from, to) });
  } else if (from || to) {
    throw new Error("Informe data inicial e final para filtrar por período.");
  }

  if (classId) and.push({ classId });

  if (studentId) {
    and.push({ studentId });
  } else if (q) {
    and.push({
      OR: [
        { student: { name: { contains: q, mode: "insensitive" } } },
        { student: { ra: { contains: q, mode: "insensitive" } } },
        { schoolClass: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  if (status === "pendente") {
    and.push({ OR: [{ actionTaken: null }, { actionTaken: "" }] });
  } else if (status === "com_acao") {
    and.push({
      AND: [{ actionTaken: { not: null } }, { NOT: { actionTaken: "" } }],
    });
  }

  return and.length ? { AND: and } : {};
}
