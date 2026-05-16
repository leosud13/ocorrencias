import Link from "next/link";
import { UserCreateForm } from "@/components/user-create-form";
import { UserManagementPanel } from "@/components/user-management-panel";

export default function GestaoUsuariosPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-600">
            Cadastre novos usuários e mantenha os acessos da escola atualizados.
          </p>
        </div>
        <Link
          href="/gestao/usuarios/novo"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Novo usuário
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">Cadastro rápido</h2>
        <UserCreateForm compact />
      </section>

      <UserManagementPanel />
    </div>
  );
}
