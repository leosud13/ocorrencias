import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const PAGE_SIZE = 20;

const studentListInclude = {
  class: { select: { id: true, name: true } },
  _count: { select: { occurrences: true } },
} as const;

function buildStudentListWhere(searchParams: URLSearchParams): Prisma.StudentWhereInput {
  const classId = searchParams.get("classId")?.trim();
  const q = searchParams.get("q")?.trim() ?? "";

  const where: Prisma.StudentWhereInput = {};
  if (classId) where.classId = classId;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { ra: { contains: q, mode: "insensitive" } },
      { class: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  return where;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const where = buildStudentListWhere(searchParams);
  const orderBy: Prisma.StudentOrderByWithRelationInput[] = [
    { class: { name: "asc" } },
    { name: "asc" },
  ];

  const pageParam = searchParams.get("page");
  if (pageParam !== null) {
    const page = Math.max(1, Number.parseInt(pageParam, 10) || 1);
    const skip = (page - 1) * PAGE_SIZE;

    const [total, items] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        orderBy,
        skip,
        take: PAGE_SIZE,
        include: studentListInclude,
      }),
    ]);

    return NextResponse.json({
      items,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  }

  const students = await prisma.student.findMany({
    where,
    orderBy,
    include: studentListInclude,
  });

  return NextResponse.json(students);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== UserRole.GESTAO) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = (await req.json()) as { classId?: string; name?: string; ra?: string };
  const classId = body.classId?.trim();
  const name = body.name?.trim();
  const ra = body.ra?.trim();

  if (!classId || !name || !ra) {
    return NextResponse.json(
      { error: "Classe (turma), nome e RA são obrigatórios." },
      { status: 400 },
    );
  }

  const turma = await prisma.schoolClass.findUnique({ where: { id: classId } });
  if (!turma) {
    return NextResponse.json({ error: "Turma não encontrada." }, { status: 400 });
  }

  try {
    const student = await prisma.student.create({
      data: { classId, name, ra },
      include: { class: { select: { name: true } } },
    });
    return NextResponse.json(student, { status: 201 });
  } catch {
    return NextResponse.json({ error: "RA já cadastrado ou dados inválidos." }, { status: 400 });
  }
}
