import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { OccurrenceReason, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDateTimeBR } from "@/lib/date-time";
import { getSession } from "@/lib/session";
import { OCCURRENCE_REASON_LABELS } from "@/lib/occurrence-reasons";
import { buildOccurrenceWhere, parseReportQuery } from "@/lib/report-filters";

function excelSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 28) || "Aluno";
  let n = base.slice(0, 31);
  let i = 1;
  while (used.has(n)) {
    const suffix = `_${i++}`;
    n = `${base.slice(0, 31 - suffix.length)}${suffix}`;
  }
  used.add(n);
  return n;
}

function rowFromOccurrence(o: {
  controlNumber: string;
  registeredAt: Date;
  occurredAt: Date;
  reason: OccurrenceReason;
  details: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  actionTaken: string | null;
  author: { name: string; email: string | null };
  schoolClass: { name: string };
  student: { name: string; ra: string };
  attachments: { id: string }[];
}) {
  return {
    "Nº controle": o.controlNumber,
    "Data registro": formatDateTimeBR(o.registeredAt),
    "Data ocorrência": formatDateTimeBR(o.occurredAt),
    Turma: o.schoolClass.name,
    Aluno: o.student.name,
    RA: o.student.ra,
    Autor: o.author.name,
    "E-mail autor": o.author.email ?? "",
    Motivo: OCCURRENCE_REASON_LABELS[o.reason],
    Detalhes: o.details ?? "",
    "Responsável (nome)": o.parentName ?? "",
    "Responsável (telefone)": o.parentPhone ?? "",
    "Responsável (e-mail)": o.parentEmail ?? "",
    "Ação / encaminhamento": o.actionTaken ?? "",
    "Qtd anexos": o.attachments.length,
  };
}

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

  const mode = searchParams.get("mode") === "by_student" ? "by_student" : "total";

  const where = buildOccurrenceWhere(q);

  const rows = await prisma.occurrence.findMany({
    where,
    orderBy: [{ occurredAt: "desc" }, { controlNumber: "desc" }],
    include: {
      author: { select: { name: true, email: true } },
      schoolClass: { select: { name: true } },
      student: { select: { name: true, ra: true } },
      attachments: { select: { id: true } },
    },
  });

  const wb = XLSX.utils.book_new();

  if (mode === "total") {
    const data = rows.map(rowFromOccurrence);
    const ws = XLSX.utils.json_to_sheet(data.length ? data : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, "Ocorrências");
  } else {
    const summary = new Map<
      string,
      { studentId: string; name: string; ra: string; className: string; count: number }
    >();

    for (const o of rows) {
      const cur = summary.get(o.studentId);
      if (!cur) {
        summary.set(o.studentId, {
          studentId: o.studentId,
          name: o.student.name,
          ra: o.student.ra,
          className: o.schoolClass.name,
          count: 1,
        });
      } else {
        cur.count += 1;
      }
    }

    const resumoRows = Array.from(summary.values()).map((s) => ({
      Aluno: s.name,
      RA: s.ra,
      Turma: s.className,
      "Qtd ocorrências": s.count,
    }));
    resumoRows.sort((a, b) => b["Qtd ocorrências"] - a["Qtd ocorrências"]);

    const ws0 = XLSX.utils.json_to_sheet(resumoRows.length ? resumoRows : [{}]);
    XLSX.utils.book_append_sheet(wb, ws0, "Resumo");

    const usedNames = new Set<string>(["Resumo"]);
    const byStudent = new Map<string, typeof rows>();
    for (const o of rows) {
      const list = byStudent.get(o.studentId) ?? [];
      list.push(o);
      byStudent.set(o.studentId, list);
    }

    let sheets = 0;
    const maxSheets = 28;
    for (const list of Array.from(byStudent.values())) {
      if (sheets >= maxSheets) break;
      const first = list[0];
      const label = `${first.student.name} (${first.student.ra})`;
      const sheet = excelSheetName(label, usedNames);
      const data = list.map(rowFromOccurrence);
      const ws = XLSX.utils.json_to_sheet(data.length ? data : [{}]);
      XLSX.utils.book_append_sheet(wb, ws, sheet);
      sheets += 1;
    }

    if (byStudent.size > maxSheets) {
      const ws = XLSX.utils.json_to_sheet([
        {
          Aviso: `Há ${byStudent.size} alunos com ocorrências; apenas as primeiras ${maxSheets} abas por aluno foram incluídas. Use o export "Total" ou refine os filtros.`,
        },
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "Aviso");
    }
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const fname =
    mode === "total"
      ? `relatorio-ocorrencias-total_${q.from}_${q.to}.xlsx`
      : `relatorio-ocorrencias-por-aluno_${q.from}_${q.to}.xlsx`;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  });
}
