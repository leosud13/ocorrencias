export const BRASILIA_TIME_ZONE = "America/Sao_Paulo";

export function formatDateTimeBR(date: Date): string {
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: BRASILIA_TIME_ZONE,
  });
}

export function formatDateBR(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    timeZone: BRASILIA_TIME_ZONE,
  });
}

export function formatDateTimeInputBR(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRASILIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

export function formatDateInputBR(date = new Date()): string {
  return formatDateTimeInputBR(date).slice(0, 10);
}

export function dateTimeInputBRToISOString(value: string): string {
  return new Date(`${value}:00-03:00`).toISOString();
}

export function dateRangeToBrasiliaUtc(from: string, to: string) {
  const end = new Date(`${to}T03:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);

  return {
    gte: new Date(`${from}T03:00:00.000Z`),
    lte: end,
  };
}

export function getBrasiliaYear(date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en", {
      timeZone: BRASILIA_TIME_ZONE,
      year: "numeric",
    }).format(date),
  );
}
