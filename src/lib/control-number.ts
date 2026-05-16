import { prisma } from "@/lib/db";
import { getBrasiliaYear } from "@/lib/date-time";

export async function generateControlNumber(): Promise<string> {
  const year = getBrasiliaYear();
  const prefix = `OCC-${year}-`;

  const last = await prisma.occurrence.findFirst({
    where: { controlNumber: { startsWith: prefix } },
    orderBy: { controlNumber: "desc" },
    select: { controlNumber: true },
  });

  let next = 1;
  if (last?.controlNumber) {
    const suffix = last.controlNumber.slice(prefix.length);
    const parsed = parseInt(suffix, 10);
    if (!Number.isNaN(parsed)) next = parsed + 1;
  }

  return `${prefix}${String(next).padStart(6, "0")}`;
}
