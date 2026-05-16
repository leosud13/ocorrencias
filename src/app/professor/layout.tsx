import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { UserRole } from "@prisma/client";
import { SignOutButton } from "@/components/sign-out-button";
import { USER_ROLE_LABELS } from "@/lib/user-roles";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (
    !session?.user ||
    session.user.isBlocked ||
    (session.user.role !== UserRole.PROFESSOR && session.user.role !== UserRole.AGENTE_ESCOLAR)
  ) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-slate-900">Área do {USER_ROLE_LABELS[session.user.role]}</span>
            <nav className="flex gap-4 text-sm">
              <Link className="text-brand-700 hover:underline" href="/professor/ocorrencias">
                Minhas ocorrências
              </Link>
              <Link className="text-brand-700 hover:underline" href="/professor/ocorrencias/nova">
                Nova ocorrência
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
            )}
            <Link className="text-brand-700 hover:underline" href="/perfil">
              {session.user.name}
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
