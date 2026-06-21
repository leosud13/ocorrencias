import { UserRole } from "@prisma/client";
import { canRegisterOccurrences } from "@/lib/user-roles";

type SessionUser = {
  id: string;
  role: UserRole;
  isBlocked?: boolean;
};

type OccurrenceAccess = {
  authorId: string;
};

export function canViewOccurrence(user: SessionUser, occurrence: OccurrenceAccess): boolean {
  if (user.isBlocked) return false;
  if (user.role === UserRole.GESTAO) return true;
  if (user.role === UserRole.PROFESSOR || user.role === UserRole.AGENTE_ESCOLAR) {
    return occurrence.authorId === user.id;
  }
  return false;
}

export function canContributeToOccurrence(user: SessionUser, occurrence: OccurrenceAccess): boolean {
  return canViewOccurrence(user, occurrence) && canRegisterOccurrences(user.role);
}

export function canManageOccurrenceTratativa(user: SessionUser): boolean {
  return !user.isBlocked && user.role === UserRole.GESTAO;
}
