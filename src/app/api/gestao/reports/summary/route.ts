import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDateInputBR } from "@/lib/date-time";
import { getSession } from "@/lib/session";
import { OCCURRENCE_REASON_LABELS } from "@/lib/occurrence-reasons";
import { buildOccurrenceWhere, parseReportQuery } from "@/lib/report-filters";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = parseReportQuery(searchParams);
  if (!q) {
    return NextResponse.json({ error: "Informe from e to (YYYY-MM-DD)." }, { status: 400 });
  }

  const where = buildOccurrenceWhere(q);

  const [
    total,
    byReason,
    byClass,
    byStudent,
    dates,
  ] = await Promise.all([
    prisma.occurrence.count({ where }),
    prisma.occurrence.groupBy({
      by: ["reason"],
      where,
      _count: { _all: true },
    }),
    prisma.occurrence.groupBy({
      by: ["classId"],
      where,
      _count: { _all: true },
    }),
    prisma.occurrence.groupBy({
      by: ["studentId"],
      where,
      _count: { _all: true },
    }),
    prisma.occurrence.findMany({
      where,
      select: { occurredAt: true },
    }),
  ]);

  const classIds = Array.from(new Set(byClass.map((b) => b.classId)));
  const studentIds = Array.from(new Set(byStudent.map((b) => b.studentId)));

  const [classes, students] = await Promise.all([
    classIds.length
      ? prisma.schoolClass.findMany({
          where: { id: { in: classIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    studentIds.length
      ? prisma.student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, name: true, ra: true, class: { select: { name: true } } },
        })
      : Promise.resolve([] as { id: string; name: string; ra: string; class: { name: string } }[]),
  ]);

  const classNamesById = new Map(classes.map((c) => [c.id, c.name]));

  const byClassOut = byClass
    .map((b) => ({
      classId: b.classId,
      className: classNamesById.get(b.classId) ?? b.classId,
      count: b._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const studentMap = new Map(students.map((s) => [s.id, s]));

  const byStudentOut = byStudent
    .map((b) => {
      const s = studentMap.get(b.studentId);
      return {
        studentId: b.studentId,
        studentName: s?.name ?? "—",
        ra: s?.ra ?? "",
        className: s?.class.name ?? "—",
        count: b._count._all,
      };
    })
    .sort((a, b) => b.count - a.count);

  const byReasonOut = byReason
    .map((b) => {
      const count = b._count._all;
      return {
        reason: b.reason,
        label: OCCURRENCE_REASON_LABELS[b.reason],
        count,
        pct: total === 0 ? 0 : Math.round((count / total) * 1000) / 10,
      };
    })
    .sort((a, b) => b.count - a.count);

  const dayCounts = new Map<string, number>();
  for (const d of dates) {
    const key = formatDateInputBR(d.occurredAt);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }
  const series = Array.from(dayCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    filters: q,
    total,
    byReason: byReasonOut,
    byClass: byClassOut,
    byStudent: byStudentOut,
    series,
  });
}
