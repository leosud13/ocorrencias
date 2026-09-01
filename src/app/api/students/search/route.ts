import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { searchStudentsByName } from "@/lib/student-search";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const classId = searchParams.get("classId")?.trim();
  if (q.length < 1) {
    return NextResponse.json([]);
  }

  const students = await searchStudentsByName(q, classId);
  return NextResponse.json(students);
}
