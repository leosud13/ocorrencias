import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type Params = { params: { id: string } };

export async function PATCH(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id || session.user.isBlocked) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const notification = await prisma.notification.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notificação não encontrada." }, { status: 404 });
  }

  if (!notification.readAt) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
