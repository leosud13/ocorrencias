import { OccurrenceStudentRole } from "@prisma/client";

export const OCCURRENCE_STUDENT_ROLE_LABELS: Record<OccurrenceStudentRole, string> = {
  AUTOR: "Autor",
  VITIMA: "Vítima",
  TESTEMUNHA: "Testemunha",
};

export const OCCURRENCE_STUDENT_ROLE_OPTIONS = (
  Object.keys(OCCURRENCE_STUDENT_ROLE_LABELS) as OccurrenceStudentRole[]
).map((value) => ({ value, label: OCCURRENCE_STUDENT_ROLE_LABELS[value] }));

export function formatOccurrenceStudentRoles(
  roles: OccurrenceStudentRole[] | null | undefined,
): string {
  if (!roles?.length) return "—";
  return roles.map((role) => OCCURRENCE_STUDENT_ROLE_LABELS[role]).join(", ");
}
