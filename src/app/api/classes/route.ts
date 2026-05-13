import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const classes = await prisma.schoolClass.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return NextResponse.json(classes);
}
