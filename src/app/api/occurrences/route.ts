import { NextResponse } from "next/server";
import { OccurrenceReason, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateControlNumber } from "@/lib/control-number";
import { canRegisterOccurrences } from "@/lib/user-roles";
import { saveOccurrenceAttachments } from "@/lib/occurrence-attachments";
import {
  buildOccurrenceListWhere,
  parseOccurrenceListFilters,
} from "@/lib/occurrence-list-filters";

const REASONS = new Set<string>(Object.values(OccurrenceReason));

const PAGE_SIZE = 20;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filters = parseOccurrenceListFilters(searchParams);

  let filterWhere: Prisma.OccurrenceWhereInput;
  try {
    filterWhere = buildOccurrenceListWhere(filters);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Filtros inválidos.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const where: Prisma.OccurrenceWhereInput =
    session.user.role === UserRole.GESTAO
      ? filterWhere
      : { AND: [filterWhere, { authorId: session.user.id }] };

  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [total, rows] = await Promise.all([
    prisma.occurrence.count({ where }),
    prisma.occurrence.findMany({
      where,
      orderBy: { registeredAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        author: { select: { name: true, email: true } },
        schoolClass: { select: { name: true } },
        student: { select: { name: true, ra: true } },
        attachments: { select: { id: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return NextResponse.json({
    items: rows,
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages,
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.isBlocked || !canRegisterOccurrences(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão para registrar ocorrências." }, { status: 403 });
  }

  const form = await req.formData();
  const classId = String(form.get("classId") ?? "");
  const studentId = String(form.get("studentId") ?? "");
  const reason = String(form.get("reason") ?? "");
  const details = form.get("details") ? String(form.get("details")) : null;
  const occurredAtRaw = String(form.get("occurredAt") ?? "");

  if (!classId || !studentId || !reason || !occurredAtRaw) {
    return NextResponse.json({ error: "Preencha turma, aluno, motivo e data da ocorrência." }, { status: 400 });
  }

  if (!REASONS.has(reason)) {
    return NextResponse.json({ error: "Motivo inválido." }, { status: 400 });
  }

  const occurredAt = new Date(occurredAtRaw);
  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json({ error: "Data da ocorrência inválida." }, { status: 400 });
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, classId },
  });
  if (!student) {
    return NextResponse.json({ error: "Aluno não pertence à turma selecionada." }, { status: 400 });
  }

  const controlNumber = await generateControlNumber();

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  const occurrence = await prisma.$transaction(async (tx) => {
    const occ = await tx.occurrence.create({
      data: {
        controlNumber,
        authorId: session.user.id,
        classId,
        studentId,
        occurredAt,
        reason: reason as OccurrenceReason,
        details: details?.trim() || null,
      },
    });

    if (files.length > 0) {
      await saveOccurrenceAttachments(occ.id, files, tx);
    }

    return occ;
  });

  return NextResponse.json(occurrence, { status: 201 });
}
