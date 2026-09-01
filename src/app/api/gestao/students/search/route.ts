import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const classId = searchParams.get("classId")?.trim();
  if (q.length < 1) {
    return NextResponse.json([]);
  }

  const where: Prisma.StudentWhereInput = {
    name: { contains: q, mode: "insensitive" },
  };
  if (classId) where.classId = classId;

  const students = await prisma.student.findMany({
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

  return NextResponse.json(students);
}
