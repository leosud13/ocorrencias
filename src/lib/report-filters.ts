import { OccurrenceReason, Prisma } from "@prisma/client";
import { dateRangeToBrasiliaUtc } from "@/lib/date-time";

const REASON_SET = new Set<string>(Object.values(OccurrenceReason));

export type ReportQueryInput = {
  from: string;
  to: string;
  classId?: string | null;
  studentId?: string | null;
  reason?: OccurrenceReason | null;
};

export function parseReportQuery(searchParams: URLSearchParams): ReportQueryInput | null {
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();
  if (!from || !to) return null;
  const classId = searchParams.get("classId")?.trim() || null;
  const studentId = searchParams.get("studentId")?.trim() || null;
  const reasonRaw = searchParams.get("reason")?.trim() || null;
  const reason =
    reasonRaw && REASON_SET.has(reasonRaw) ? (reasonRaw as OccurrenceReason) : null;
  return {
    from,
    to,
    classId: classId || null,
    studentId: studentId || null,
    reason,
  };
}

export function buildOccurrenceWhere(q: ReportQueryInput): Prisma.OccurrenceWhereInput {
  const where: Prisma.OccurrenceWhereInput = {
    occurredAt: dateRangeToBrasiliaUtc(q.from, q.to),
  };
  if (q.classId) where.classId = q.classId;
  if (q.studentId) where.studentId = q.studentId;
  if (q.reason) where.reason = q.reason;
  return where;
}
