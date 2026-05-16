import { UserRole } from "@prisma/client";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.GESTAO]: "Gestão",
  [UserRole.PROFESSOR]: "Professor",
  [UserRole.AGENTE_ESCOLAR]: "Agente escolar",
};

export const USER_ROLE_OPTIONS = [
  { value: UserRole.GESTAO, label: USER_ROLE_LABELS[UserRole.GESTAO] },
  { value: UserRole.PROFESSOR, label: USER_ROLE_LABELS[UserRole.PROFESSOR] },
  { value: UserRole.AGENTE_ESCOLAR, label: USER_ROLE_LABELS[UserRole.AGENTE_ESCOLAR] },
];

export function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}

export function canRegisterOccurrences(role: UserRole): boolean {
  return role === UserRole.PROFESSOR || role === UserRole.GESTAO || role === UserRole.AGENTE_ESCOLAR;
}
