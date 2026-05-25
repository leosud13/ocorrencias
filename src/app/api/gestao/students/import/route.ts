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

  const baseDigits = raBase.replace(/\D/g, "");
  const base = baseDigits.replace(/^0+/, "") || "0";
  const digTrim = dig.trim().toUpperCase();
  const suffix = /^[0-9X]$/.test(digTrim) ? digTrim : digTrim.replace(/\D/g, "");
  return (base + suffix).toUpperCase();
}

function decodeCsvBuffer(buf: Buffer): string {
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.toString("utf8").replace(/^\uFEFF/, "");
  }
  const utf8 = buf.toString("utf8");
  if (/Nome do Aluno/i.test(utf8) || /Situação do Aluno/i.test(utf8)) {
    return utf8.replace(/^\uFEFF/, "");
  }
  return buf.toString("latin1").replace(/^\uFEFF/, "");
}

function rowHasStudentHeaders(keys: string[]): boolean {
  const hasNome = keys.some((k) => normalizeKey(k).includes("nome") || normalizeKey(k) === "aluno");
  const hasRa = keys.some((k) => normalizeKey(k) === "ra");
  return hasNome && hasRa;
}

function findHeaderLineIndex(lines: string[]): number {
  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    const parts = line.split(";").map((p) => normalizeKey(p));
    const hasNome = parts.some((p) => p.includes("nome") && (p.includes("aluno") || p === "nome do aluno"));
    const hasRa = parts.some((p) => p === "ra");
    if (hasNome && hasRa) return i;
  }
  return -1;
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

  const text = decodeCsvBuffer(buf);
  const lines = text.split(/\r?\n/);
  const headerIdx = findHeaderLineIndex(lines);
  const sampleLine =
    (headerIdx >= 0 ? lines[headerIdx] : lines.find((l) => l.trim()))?.trim() ?? "";
  const FS = detectCsvDelimiter(sampleLine);
  const csvBody = headerIdx >= 0 ? lines.slice(headerIdx).join("\n") : text;
  return XLSX.read(csvBody, { type: "string", FS });
}

function sheetRowsToStudents(sheet: XLSX.WorkSheet): Record<string, unknown>[] {
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

type ParsedStudentRow = { line: number; name: string; ra: string };

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

  let rows = sheetRowsToStudents(wb.Sheets[sheetName]);

  if (rows.length > 0 && !rowHasStudentHeaders(Object.keys(rows[0]))) {
    return NextResponse.json(
      {
        error:
          "Cabeçalhos não reconhecidos. O arquivo precisa das colunas Nome do aluno, RA e Dig. RA (modelo simples ou lista exportada do sistema escolar).",
      },
      { status: 400 },
    );
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Nenhuma linha de aluno encontrada no arquivo." }, { status: 400 });
  }

  const errors: string[] = [];
  const pending: ParsedStudentRow[] = [];
  const raInFile = new Set<string>();

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

    if (raInFile.has(ra)) {
      errors.push(`Linha ${line}: RA ${ra} repetido no arquivo — ignorado.`);
      continue;
    }
    raInFile.add(ra);
    pending.push({ line, name: nomeAluno.trim(), ra });
  }

  if (pending.length === 0) {
    return NextResponse.json({
      ok: true,
      createdClasses: 0,
      createdStudents: 0,
      errors,
      turma: turma.name,
    });
  }

  const existing = await prisma.student.findMany({
    where: { ra: { in: [...raInFile] } },
    select: { ra: true },
  });
  const existingRas = new Set(existing.map((s) => s.ra));

  const toCreate: { classId: string; name: string; ra: string }[] = [];
  for (const row of pending) {
    if (existingRas.has(row.ra)) {
      errors.push(`Linha ${row.line}: RA ${row.ra} já existe — ignorado.`);
      continue;
    }
    toCreate.push({ classId: turma.id, name: row.name, ra: row.ra });
  }

  let createdStudents = 0;
  if (toCreate.length > 0) {
    try {
      const result = await prisma.student.createMany({ data: toCreate });
      createdStudents = result.count;
    } catch (e) {
      console.error("student import failed", e);
      return NextResponse.json(
        { error: "Erro ao salvar alunos no banco. Tente novamente ou importe em partes menores." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    createdClasses: 0,
    createdStudents,
    errors,
    turma: turma.name,
  });
}
