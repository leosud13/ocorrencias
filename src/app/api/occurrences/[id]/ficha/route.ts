import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { buildOccurrenceFichaHtml } from "@/lib/occurrence-ficha-html";
import { canViewOccurrence } from "@/lib/occurrence-access";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const o = await prisma.occurrence.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { name: true, email: true } },
      schoolClass: { select: { name: true } },
      student: { select: { name: true, ra: true } },
    },
  });

  if (!o) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  if (!canViewOccurrence(session.user, o)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const html = buildOccurrenceFichaHtml({
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
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="ficha-${o.controlNumber}.html"`,
    },
  });
}
