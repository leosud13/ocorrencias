import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

type Params = { params: { classId: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { classId } = params;

  const students = await prisma.student.findMany({
    where: { classId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, ra: true },
  });

  return NextResponse.json(students);
}
