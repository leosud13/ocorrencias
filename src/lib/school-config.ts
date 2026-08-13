const DEFAULT_SCHOOL_NAME = "Ocorrências Escolares";

/** Nome exibido na UI e nas fichas (configurável por instância). */
export function getSchoolName(): string {
  return process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() || DEFAULT_SCHOOL_NAME;
}

export function getSchoolPageTitle(): string {
  return getSchoolName();
}

export function getSchoolDescription(): string {
  return `Sistema de gerenciamento de ocorrências — ${getSchoolName()}`;
}
