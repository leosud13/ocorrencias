import type { OccurrenceReason } from "@prisma/client";
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
};

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
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function buildOccurrenceFichaHtml(o: FichaOccurrence): string {
  const motivo = OCCURRENCE_REASON_LABELS[o.reason];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ficha ${esc(o.controlNumber)}</title>
  <style>
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
    @media print {
      body { padding: 12px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <p class="no-print"><button type="button" onclick="window.print()" style="padding:8px 14px;font-size:14px;cursor:pointer;border-radius:8px;border:1px solid #cbd5e1;background:#fff;">Imprimir / salvar em PDF</button></p>
  <h1>Ficha de ocorrência escolar</h1>
  <p class="sub">Nº de controle: <strong>${esc(o.controlNumber)}</strong></p>

  <table>
    <tr><th>Aluno</th><td>${esc(o.student.name)} — RA ${esc(o.student.ra)}</td></tr>
    <tr><th>Turma</th><td>${esc(o.schoolClass.name)}</td></tr>
    <tr><th>Professor / agente (autor do registro)</th><td>${esc(o.author.name)}${o.author.email ? ` (${esc(o.author.email)})` : ""}</td></tr>
    <tr><th>Data de registro no sistema</th><td>${esc(fmtDate(o.registeredAt))}</td></tr>
    <tr><th>Data e horário da ocorrência</th><td>${esc(fmtDate(o.occurredAt))}</td></tr>
    <tr><th>Motivo</th><td>${esc(motivo)}</td></tr>
    <tr><th>Detalhes</th><td>${escMultiline(o.details)}</td></tr>
  </table>

  <table>
    <tr><th colspan="2">Tratativa / contato com a família</th></tr>
    <tr><th>Responsável pelo aluno</th><td>${esc(o.parentName)}</td></tr>
    <tr><th>Telefone</th><td>${esc(o.parentPhone)}</td></tr>
    <tr><th>E-mail</th><td>${esc(o.parentEmail)}</td></tr>
    <tr><th>Ação tomada / encaminhamento</th><td>${escMultiline(o.actionTaken)}</td></tr>
  </table>

  <div class="block">
    <p class="sig-title">Assinaturas (após reunião ou ciência)</p>
    <p class="hint">As assinaturas atestam ciência do conteúdo desta ficha e das medidas comunicadas.</p>
  </div>

  <div class="block">
    <div class="sig-title">Gestão escolar</div>
    <div class="line"></div>
    <div class="hint">Nome completo e carimbo (se houver)</div>
  </div>

  <div class="block">
    <div class="sig-title">Professor ou agente escolar</div>
    <div class="line"></div>
    <div class="hint">Nome completo — mesmo do registro: ${esc(o.author.name)}</div>
  </div>

  <div class="block">
    <div class="sig-title">Responsável pelo aluno</div>
    <div class="line"></div>
    <div class="hint">Nome completo — documento de identificação conforme política da escola</div>
  </div>

  <p class="no-print hint" style="margin-top:32px">Use o botão acima ou Ctrl+P. Em “Destino”, escolha “Salvar como PDF” se desejar arquivo digital.</p>
</body>
</html>`;
}
