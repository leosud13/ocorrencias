import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { UserRole } from "@prisma/client";
import { SignOutButton } from "@/components/sign-out-button";
import { CadastrosMenu } from "@/components/navigation/cadastros-menu";
import { NotificationsBell } from "@/components/notifications-bell";
import { FloatingNewOccurrenceButton } from "@/components/floating-new-occurrence-button";
import { getSchoolName } from "@/lib/school-config";

export default async function GestaoLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user || session.user.role !== UserRole.GESTAO || session.user.isBlocked) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <span className="font-semibold text-slate-900">{getSchoolName()}</span>
            <nav className="flex flex-wrap gap-4 text-sm">
              <Link className="text-brand-700 hover:underline" href="/gestao">
                Painel
              </Link>
              <Link className="text-brand-700 hover:underline" href="/gestao/ocorrencias">
                Ocorrências
              </Link>
              <Link className="text-brand-700 hover:underline" href="/gestao/relatorios">
                Relatórios
              </Link>
              <CadastrosMenu />
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <NotificationsBell />
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
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <FloatingNewOccurrenceButton
        href="/gestao/ocorrencias/nova"
        hiddenPrefixes={["/gestao/ocorrencias", "/gestao/relatorios"]}
      />
    </div>
  );
}
