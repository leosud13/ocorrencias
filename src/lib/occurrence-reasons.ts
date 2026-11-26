import { OccurrenceReason } from "@prisma/client";

export const OCCURRENCE_REASON_LABELS: Record<OccurrenceReason, string> = {
  INDISCIPLINA: "Indisciplina",
  USO_CELULAR: "Uso de celular",
  SAIU_SEM_AUTORIZACAO: "Saiu sem autorização",
  NAO_FEZ_ATIVIDADE: "Não fez a atividade",
  LINGUAGEM_IMPROPRIA: "Linguagem imprópria",
  BULLYING: "Bullying",
  AGRESSAO: "Agressão Física",
  AGRESSAO_VERBAL: "Agressão verbal",
  SUBSTANCIAS_ILICITAS: "Substâncias ilícitas",
  USO_VAPE_POD: "Uso de Vape / POD",
  DESACATO_FUNCIONARIO: "Desacato a funcionário",
  CONVERSAS_PARALELAS: "Conversas paralelas",
  BUSCA_ATIVA: "Busca Ativa",
  OUTROS: "Outros",
};

export const OCCURRENCE_REASON_OPTIONS = (
  Object.keys(OCCURRENCE_REASON_LABELS) as OccurrenceReason[]
).map((value) => ({ value, label: OCCURRENCE_REASON_LABELS[value] }));

export function formatOccurrenceReason(
  reason: OccurrenceReason,
  reasonOther?: string | null,
): string {
  const label = OCCURRENCE_REASON_LABELS[reason];
  if (reason === OccurrenceReason.OUTROS && reasonOther?.trim()) {
    return `${label}: ${reasonOther.trim()}`;
  }
  return label;
}
