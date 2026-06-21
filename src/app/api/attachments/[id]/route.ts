import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canViewOccurrence } from "@/lib/occurrence-access";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id || session.user.isBlocked) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const att = await prisma.occurrenceAttachment.findUnique({
    where: { id: params.id },
    include: { occurrence: { select: { authorId: true } } },
  });

  if (!att) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (!canViewOccurrence(session.user, att.occurrence)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const abs = path.join(process.cwd(), att.storedPath);
  let buffer: Buffer;
  try {
    buffer = await readFile(abs);
  } catch {
    return NextResponse.json({ error: "Arquivo ausente no servidor" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": att.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(att.fileName)}"`,
    },
  });
}
