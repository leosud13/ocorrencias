import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function searchStudentsByName(q: string, classId?: string | null) {
  const where: Prisma.StudentWhereInput = {
    name: { contains: q, mode: "insensitive" },
  };
  if (classId) where.classId = classId;

  return prisma.student.findMany({
    where,
    take: 15,
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      ra: true,
      class: { select: { name: true } },
    },
  });
}
