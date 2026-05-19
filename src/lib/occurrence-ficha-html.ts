import type { OccurrenceReason } from "@prisma/client";
import { formatDateTimeBR } from "@/lib/date-time";
import { OCCURRENCE_REASON_LABELS } from "@/lib/occurrence-reasons";

export type FichaOccurrence = {
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
  studentId?: string;
};

type FichaContentOptions = {
  includeTratativa?: boolean;
};

const FICHA_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; padding: 24px; color: #0f172a; line-height: 1.45; }
  h1 { font-size: 1.35rem; margin: 0 0 4px; }
  .sub { color: #64748b; font-size: 0.9rem; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.95rem; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; vertical-align: top; }
  th { width: 28%; background: #f8fafc; text-align: left; font-weight: 600; color: #334155; }
  .block { margin-top: 28px; page-break-inside: avoid; }
  .sig-title { font-weight: 600; margin-bottom: 8px; }
  .line { border-bottom: 1px solid #0f172a; height: 48px; margin-top: 8px; }
  .hint { font-size: 0.8rem; color: #64748b; margin-top: 4px; }
  .ficha { margin-bottom: 48px; padding-bottom: 32px; border-bottom: 2px dashed #e2e8f0; }
  .ficha:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
  .ficha-item { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px dashed #e2e8f0; }
  .ficha-item:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .ficha-item h2 { font-size: 1.05rem; margin: 0 0 12px; }
  .batch-signature { margin-top: 40px; padding-top: 24px; border-top: 2px solid #0f172a; }
  @media print {
    body { padding: 12px; }
    .no-print { display: none !important; }
    .ficha { page-break-after: always; margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
    .ficha:last-child { page-break-after: auto; }
    .batch-signature { page-break-before: always; }
    .ficha-item { page-break-inside: avoid; }
  }
`;

function esc(s: string | null | undefined): string {
  if (s == null || s === "") return "—";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escMultiline(s: string | null | undefined): string {
  if (s == null || s === "") return "—";
  return esc(s).replace(/\r\n|\n|\r/g, "<br/>");
}

function fmtDate(d: Date): string {
  return formatDateTimeBR(d);
}

function buildTratativaTable(o: FichaOccurrence): string {
  return `
  <table>
    <tr><th colspan="2">Tratativa / contato com a família</th></tr>
    <tr><th>Responsável pelo aluno</th><td>${esc(o.parentName)}</td></tr>
    <tr><th>Telefone</th><td>${esc(o.parentPhone)}</td></tr>
    <tr><th>E-mail</th><td>${esc(o.parentEmail)}</td></tr>
    <tr><th>Ação tomada / encaminhamento</th><td>${escMultiline(o.actionTaken)}</td></tr>
  </table>`;
}

function buildOccurrenceFichaContent(
  o: FichaOccurrence,
  heading: "h1" | "h2" = "h1",
  options: FichaContentOptions = {},
): string {
  const includeTratativa = options.includeTratativa ?? true;
  const motivo = OCCURRENCE_REASON_LABELS[o.reason];
  const title =
    heading === "h1"
      ? `<h1>Ficha de ocorrência escolar</h1>`
      : `<h2>Ocorrência nº ${esc(o.controlNumber)}</h2>`;
  const subtitle =
    heading === "h1" ? `<p class="sub">Nº de controle: <strong>${esc(o.controlNumber)}</strong></p>` : "";

  return `
  ${title}
  ${subtitle}

  <table>
    <tr><th>Aluno</th><td>${esc(o.student.name)} — RA ${esc(o.student.ra)}</td></tr>
    <tr><th>Turma</th><td>${esc(o.schoolClass.name)}</td></tr>
    <tr><th>Professor / agente (autor do registro)</th><td>${esc(o.author.name)}${o.author.email ? ` (${esc(o.author.email)})` : ""}</td></tr>
    <tr><th>Data de registro no sistema</th><td>${esc(fmtDate(o.registeredAt))}</td></tr>
    <tr><th>Data e horário da ocorrência</th><td>${esc(fmtDate(o.occurredAt))}</td></tr>
    <tr><th>Motivo</th><td>${esc(motivo)}</td></tr>
    <tr><th>Detalhes</th><td>${escMultiline(o.details)}</td></tr>
  </table>
  ${includeTratativa ? buildTratativaTable(o) : ""}`;
}

function countOccurrencesByStudent(items: FichaOccurrence[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const o of items) {
    const key = o.studentId ?? o.student.ra;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function buildOccurrenceFichaSignatures(): string {
  return `
  <div class="block">
    <p class="sig-title">Assinaturas (após reunião ou ciência)</p>
    <p class="hint">As assinaturas atestam ciência do conteúdo desta ficha e das medidas comunicadas.</p>
  </div>

  <div class="block">
    <div class="sig-title">Gestor escolar</div>
    <div class="line"></div>
    <div class="hint">Nome completo e carimbo (se houver)</div>
  </div>


  <div class="block">
    <div class="sig-title">Responsável pelo aluno</div>
    <div class="line"></div>
    <div class="hint">Nome completo — documento de identificação conforme política da escola</div>
  </div>`;
}

function buildBatchCompiledSignature(items: FichaOccurrence[]): string {
  const numbers = items.map((o) => esc(o.controlNumber)).join(", ");
  return `
  <div class="block batch-signature">
    <p class="sig-title">Assinaturas — ciência do compilado de ocorrências</p>
    <p class="hint">
      Ciência do conteúdo das <strong>${items.length}</strong> ocorrência(s) descritas neste documento
      (Nº ${numbers}) e das medidas comunicadas pela escola.
    </p>
  </div>

  <div class="block">
    <div class="sig-title">Gestor escolar</div>
    <div class="line"></div>
    <div class="hint">Nome completo e carimbo (se houver)</div>
    <p class="hint" style="margin-top:12px">Data: _____ / _____ / ________</p>
  </div>

  <div class="block">
    <div class="sig-title">Responsável pelo aluno</div>
    <div class="line"></div>
    <div class="hint">Nome completo — documento de identificação conforme política da escola</div>
    <p class="hint" style="margin-top:12px">Data: _____ / _____ / ________</p>
  </div>`;
}

export function buildOccurrenceFichaSection(o: FichaOccurrence): string {
  return buildOccurrenceFichaContent(o, "h1") + buildOccurrenceFichaSignatures();
}

export function buildOccurrenceFichaHtml(o: FichaOccurrence): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ficha ${esc(o.controlNumber)}</title>
  <style>${FICHA_STYLES}</style>
</head>
<body>
  <p class="no-print"><button type="button" onclick="window.print()" style="padding:8px 14px;font-size:14px;cursor:pointer;border-radius:8px;border:1px solid #cbd5e1;background:#fff;">Imprimir / salvar em PDF</button></p>
  <div class="ficha">${buildOccurrenceFichaSection(o)}</div>
  <p class="no-print hint" style="margin-top:32px">Use o botão acima ou Ctrl+P. Em “Destino”, escolha “Salvar como PDF” se desejar arquivo digital.</p>
</body>
</html>`;
}

export function buildBatchOccurrenceFichaHtml(items: FichaOccurrence[]): string {
  const countByStudent = countOccurrencesByStudent(items);
  const sections = items
    .map((o) => {
      const studentKey = o.studentId ?? o.student.ra;
      const includeTratativa = (countByStudent.get(studentKey) ?? 0) <= 1;
      return `<div class="ficha-item">${buildOccurrenceFichaContent(o, "h2", { includeTratativa })}</div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Compilado de ocorrências (${items.length})</title>
  <style>${FICHA_STYLES}</style>
</head>
<body>
  <p class="no-print"><button type="button" onclick="window.print()" style="padding:8px 14px;font-size:14px;cursor:pointer;border-radius:8px;border:1px solid #cbd5e1;background:#fff;">Imprimir todas / salvar em PDF</button></p>
  <h1>Compilado de ocorrências escolares</h1>
  <p class="sub">${items.length} ocorrência(s) neste documento — assinaturas do gestor e do responsável ao final.</p>
  ${sections}
  ${buildBatchCompiledSignature(items)}
  <p class="no-print hint" style="margin-top:32px">Use o botão acima ou Ctrl+P. Em “Destino”, escolha “Salvar como PDF”.</p>
</body>
</html>`;
}
