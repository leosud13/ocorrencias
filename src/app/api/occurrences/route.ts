import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { OccurrenceReason, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateControlNumber } from "@/lib/control-number";

const REASONS = new Set<string>(Object.values(OccurrenceReason));

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const where =
    session.user.role === UserRole.GESTAO
      ? {}
      : { authorId: session.user.id };

  const rows = await prisma.occurrence.findMany({
    where,
    orderBy: { registeredAt: "desc" },
    include: {
      author: { select: { name: true, email: true } },
      schoolClass: { select: { name: true } },
      student: { select: { name: true, ra: true } },
      attachments: { select: { id: true } },
    },
  });

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || (session.user.role !== UserRole.PROFESSOR && session.user.role !== UserRole.GESTAO)) {
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
      const baseDir = path.join(process.cwd(), "uploads", occ.id);
      await mkdir(baseDir, { recursive: true });

      for (const file of files) {
        const buf = Buffer.from(await file.arrayBuffer());
        const safe = sanitizeFileName(file.name || "arquivo");
        const storedName = `${randomUUID()}-${safe}`;
        const storedPath = path.join("uploads", occ.id, storedName);
        await writeFile(path.join(process.cwd(), storedPath), buf);

        await tx.occurrenceAttachment.create({
          data: {
            occurrenceId: occ.id,
            fileName: file.name || "arquivo",
            storedPath,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: buf.length,
          },
        });
      }
    }

    return occ;
  });

  return NextResponse.json(occurrence, { status: 201 });
}
