import Link from "next/link";
import { UserCreateForm } from "@/components/user-create-form";

export default function NovoUsuarioPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/gestao/usuarios" className="text-sm text-brand-700 hover:underline">
        Voltar para gestão de usuários
      </Link>
      <UserCreateForm />
    </div>
  );
}
