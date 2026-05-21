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

function cellToString(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "number" && Number.isFinite(v)) {
    return String(Math.trunc(v));
  }
  return String(v).trim();
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
      const s = cellToString(v);
      return s === "" ? undefined : s;
    }
  }
  return undefined;
}

function buildRaFromRow(row: Record<string, unknown>): string {
  const raBase = pickColumn(row, ["RA", "Registro do Aluno", "Registro Acadêmico", "Registro Academico"]) ?? "";
  const dig = pickColumn(row, [
    "Dig. RA",
    "DIG. RA",
    "Dig RA",
    "Digito RA",
    "Dígito RA",
    "Digito do RA",
  ]) ?? "";

  const base = raBase.replace(/\D/g, "");
  const digTrim = dig.trim().toUpperCase();
  const suffix = /^[0-9X]$/.test(digTrim) ? digTrim : digTrim.replace(/\D/g, "");
  return (base + suffix).toUpperCase();
}

function detectCsvDelimiter(firstLine: string): "," | ";" {
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

function readWorkbookFromUpload(buf: Buffer, fileName: string) {
  const lower = fileName.toLowerCase();
  if (!lower.endsWith(".csv")) {
    return XLSX.read(buf, { type: "buffer" });
  }

  // Planilhas exportadas no Excel (BR) costumam ser Latin-1 com separador ;
  const sample = buf.slice(0, 8000).toString("latin1").replace(/^\uFEFF/, "");
  const firstLine = sample.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const FS = detectCsvDelimiter(firstLine);
  return XLSX.read(buf, { type: "buffer", FS });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const classId = String(form.get("classId") ?? "").trim();

  if (!classId) {
    return NextResponse.json({ error: "Selecione a turma antes de enviar o arquivo." }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Envie um arquivo .xlsx ou .csv." }, { status: 400 });
  }

  const turma = await prisma.schoolClass.findUnique({ where: { id: classId } });
  if (!turma) {
    return NextResponse.json({ error: "Turma selecionada não encontrada." }, { status: 400 });
  }

  const name = (file.name || "").toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
    return NextResponse.json({ error: "Formato aceito: .xlsx, .xls ou .csv." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = readWorkbookFromUpload(buf, file.name || "import.csv");
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json({ error: "Planilha vazia." }, { status: 400 });
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
    defval: "",
  });

  if (rows.length > 0) {
    const keys = Object.keys(rows[0]);
    const hasNome = keys.some((k) => normalizeKey(k).includes("nome") || normalizeKey(k) === "aluno");
    const hasRa = keys.some((k) => normalizeKey(k) === "ra");
    if (!hasNome || !hasRa) {
      return NextResponse.json(
        {
          error:
            "Cabeçalhos não reconhecidos. Use colunas Nome do aluno, RA e Dig. RA (arquivo .csv com vírgula ou ponto e vírgula).",
        },
        { status: 400 },
      );
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Nenhuma linha de aluno encontrada no arquivo." }, { status: 400 });
  }

  let createdStudents = 0;
  const errors: string[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const nomeAluno = pickColumn(row, [
          "Nome",
          "NOME",
          "Aluno",
          "Nome do Aluno",
          "Nome do aluno",
          "Estudante",
          "Nome completo",
        ]);
        const ra = buildRaFromRow(row);

        if (!nomeAluno && !ra) continue;

        const line = i + 2;
        if (!nomeAluno || !ra) {
          errors.push(`Linha ${line}: informe Nome e RA (e Dig. RA, se houver).`);
          continue;
        }

        const existing = await tx.student.findUnique({ where: { ra } });
        if (existing) {
          errors.push(`Linha ${line}: RA ${ra} já existe — ignorado.`);
          continue;
        }

        await tx.student.create({
          data: { classId: turma.id, name: nomeAluno.trim(), ra },
        });
        createdStudents += 1;
      }
    });
  } catch (e) {
    console.error("student import failed", e);
    return NextResponse.json(
      { error: "Erro ao salvar alunos no banco. Tente novamente ou importe em partes menores." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    createdClasses: 0,
    createdStudents,
    errors,
    turma: turma.name,
  });
}
