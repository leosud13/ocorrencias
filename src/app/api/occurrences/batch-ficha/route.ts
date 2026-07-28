import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { buildBatchOccurrenceFichaHtml } from "@/lib/occurrence-ficha-html";

const MAX_IDS = 40;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const raw = new URL(req.url).searchParams.get("ids")?.trim() ?? "";
  const ids = [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];

  if (ids.length === 0) {
    return NextResponse.json({ error: "Selecione ao menos uma ocorrência." }, { status: 400 });
  }
  if (ids.length > MAX_IDS) {
    return NextResponse.json(
      { error: `Selecione no máximo ${MAX_IDS} ocorrências por impressão.` },
      { status: 400 },
    );
  }

  const rows = await prisma.occurrence.findMany({
    where: { id: { in: ids } },
    include: {
      author: { select: { name: true, email: true } },
      schoolClass: { select: { name: true } },
      student: { select: { id: true, name: true, ra: true } },
    },
  });

  if (rows.length === 0) {
    return NextResponse.json({ error: "Nenhuma ocorrência encontrada." }, { status: 404 });
  }

  const byId = new Map(rows.map((o) => [o.id, o]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as typeof rows;

  const html = buildBatchOccurrenceFichaHtml(
    ordered.map((o) => ({
      controlNumber: o.controlNumber,
      registeredAt: o.registeredAt,
      occurredAt: o.occurredAt,
      location: o.location,
      reason: o.reason,
      details: o.details,
      parentName: o.parentName,
      parentPhone: o.parentPhone,
      parentEmail: o.parentEmail,
      actionTaken: o.actionTaken,
      author: { name: o.author.name, email: o.author.email },
      schoolClass: { name: o.schoolClass.name },
      student: { name: o.student.name, ra: o.student.ra },
      studentId: o.student.id,
    })),
  );

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="fichas-ocorrencias.html"`,
    },
  });
}
