import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canContributeToOccurrence } from "@/lib/occurrence-access";
import { saveOccurrenceAttachments } from "@/lib/occurrence-attachments";

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const occurrence = await prisma.occurrence.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true },
  });

  if (!occurrence) {
    return NextResponse.json({ error: "Ocorrência não encontrada." }, { status: 404 });
  }

  if (!canContributeToOccurrence(session.user, occurrence)) {
    return NextResponse.json({ error: "Sem permissão para anexar arquivos nesta ocorrência." }, { status: 403 });
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "Selecione ao menos um arquivo." }, { status: 400 });
  }

  const items = await saveOccurrenceAttachments(occurrence.id, files);

  return NextResponse.json({ items }, { status: 201 });
}
