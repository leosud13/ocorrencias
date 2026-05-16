import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { ProfileForm } from "@/components/profile-form";
import { SignOutButton } from "@/components/sign-out-button";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { USER_ROLE_LABELS } from "@/lib/user-roles";

export default async function PerfilPage() {
  const session = await getSession();
  if (!session?.user?.id || session.user.isBlocked) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, imageUrl: true, role: true },
  });

  if (!user) {
    redirect("/login");
  }

  const backHref = user.role === UserRole.GESTAO ? "/gestao" : "/professor/ocorrencias";

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-semibold text-slate-900">Perfil do usuário</p>
            <p className="text-xs text-slate-500">{USER_ROLE_LABELS[user.role]}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href={backHref} className="text-brand-700 hover:underline">
              Voltar
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="px-4 py-8">
        <ProfileForm user={user} />
      </main>
    </div>
  );
}
