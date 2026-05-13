import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function normalizeKey(s: string): string {
  return stripAccents(s.trim().toLowerCase());
}

function pickColumn(
  row: Record<string, unknown>,
  candidates: string[],
): string | undefined {
  const keys = Object.keys(row);
  const map = new Map(keys.map((k) => [normalizeKey(k), k]));
  for (const c of candidates) {
    const orig = map.get(normalizeKey(c));
    if (orig) {
      const v = row[orig];
      if (v === undefined || v === null) return undefined;
      return String(v).trim();
    }
  }
  return undefined;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Envie um arquivo .xlsx ou .csv." }, { status: 400 });
  }

  const name = (file.name || "").toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
    return NextResponse.json({ error: "Formato aceito: .xlsx, .xls ou .csv." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json({ error: "Planilha vazia." }, { status: 400 });
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
    defval: "",
  });

  let createdClasses = 0;
  let createdStudents = 0;
  const errors: string[] = [];

  await prisma.$transaction(async (tx) => {
    const classCache = new Map<string, string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const turmaNome = pickColumn(row, ["Turma", "Classe", "Classe/Turma", "Série", "Serie"]);
      const nomeAluno = pickColumn(row, ["Nome", "Aluno", "Nome do Aluno", "Estudante"]);
      const ra = pickColumn(row, ["RA", "Registro do Aluno", "Registro Acadêmico"]);

      if (!turmaNome && !nomeAluno && !ra) continue;

      const line = i + 2;
      if (!turmaNome || !nomeAluno || !ra) {
        errors.push(`Linha ${line}: informe Turma, Nome e RA.`);
        continue;
      }

      let classId = classCache.get(turmaNome);
      if (!classId) {
        let turma = await tx.schoolClass.findFirst({ where: { name: turmaNome } });
        if (!turma) {
          turma = await tx.schoolClass.create({ data: { name: turmaNome } });
          createdClasses += 1;
        }
        classId = turma.id;
        classCache.set(turmaNome, classId);
      }

      const existing = await tx.student.findUnique({ where: { ra } });
      if (existing) {
        errors.push(`Linha ${line}: RA ${ra} já existe — ignorado.`);
        continue;
      }

      await tx.student.create({
        data: { classId, name: nomeAluno, ra },
      });
      createdStudents += 1;
    }
  });

  return NextResponse.json({
    ok: true,
    createdClasses,
    createdStudents,
    errors,
  });
}
