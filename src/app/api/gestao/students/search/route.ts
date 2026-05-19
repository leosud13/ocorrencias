import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const students = await prisma.student.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
    },
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
