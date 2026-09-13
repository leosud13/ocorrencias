import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  buildOccurrenceListWhere,
  parseOccurrenceListFilters,
} from "@/lib/occurrence-list-filters";

const MAX_IDS = 200;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const filters = parseOccurrenceListFilters(new URL(req.url).searchParams);

  let where;
  try {
    where = buildOccurrenceListWhere(filters);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Filtros inválidos.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const total = await prisma.occurrence.count({ where });
  if (total > MAX_IDS) {
    return NextResponse.json(
      {
        error: `Há ${total} ocorrências no filtro. Refine para no máximo ${MAX_IDS} antes de selecionar todas.`,
        total,
        max: MAX_IDS,
      },
      { status: 400 },
    );
  }

  const rows = await prisma.occurrence.findMany({
    where,
    orderBy: { registeredAt: "desc" },
    select: {
      id: true,
      studentId: true,
      student: { select: { name: true, ra: true } },
    },
  });

  const studentIds = Array.from(new Set(rows.map((r) => r.studentId)));
  const sameStudent = studentIds.length <= 1;
  const first = rows[0];

  return NextResponse.json({
    ids: rows.map((r) => r.id),
    items: rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.student.name,
      studentRa: r.student.ra,
    })),
    total: rows.length,
    sameStudent,
    studentId: sameStudent ? studentIds[0] ?? null : null,
    studentName: sameStudent ? first?.student.name ?? null : null,
    studentRa: sameStudent ? first?.student.ra ?? null : null,
  });
}
