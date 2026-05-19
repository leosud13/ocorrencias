import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  buildOccurrenceListWhere,
  parseOccurrenceListFilters,
} from "@/lib/occurrence-list-filters";

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

  const rows = await prisma.occurrence.findMany({
    where,
    orderBy: { registeredAt: "desc" },
    include: {
      author: { select: { name: true } },
      schoolClass: { select: { name: true } },
      student: { select: { name: true, ra: true } },
      attachments: { select: { id: true } },
    },
  });

  return NextResponse.json(rows);
}
