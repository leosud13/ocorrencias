import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { UserRole } from "@prisma/client";

export default async function Home() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role === UserRole.GESTAO) {
    redirect("/gestao");
  }
  redirect("/professor/ocorrencias");
}
