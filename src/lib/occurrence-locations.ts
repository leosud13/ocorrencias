import { OccurrenceLocation } from "@prisma/client";

export const OCCURRENCE_LOCATION_LABELS: Record<OccurrenceLocation, string> = {
  SALA_DE_AULA: "Sala de aula",
  PATIO: "Pátio",
  QUADRA: "Quadra",
  BANHEIRO: "Banheiro",
  CORREDORES: "Corredores",
};

export const OCCURRENCE_LOCATION_OPTIONS = (
  Object.keys(OCCURRENCE_LOCATION_LABELS) as OccurrenceLocation[]
).map((value) => ({ value, label: OCCURRENCE_LOCATION_LABELS[value] }));
