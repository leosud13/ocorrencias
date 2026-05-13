import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { UserRole } from "@prisma/client";
import { SignOutButton } from "@/components/sign-out-button";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user || session.user.role !== UserRole.PROFESSOR) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-slate-900">Área do Professor</span>
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
            <span>{session.user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
