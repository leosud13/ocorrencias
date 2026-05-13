import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function GestaoDashboardPage() {
  const [total, lastWeek, pendingFollowUp] = await Promise.all([
    prisma.occurrence.count(),
    prisma.occurrence.count({
      where: {
        registeredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.occurrence.count({
      where: { OR: [{ actionTaken: null }, { actionTaken: "" }] },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Painel de acompanhamento</h1>
        <p className="text-sm text-slate-600">
          Visão global das ocorrências registradas na escola.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total de ocorrências</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Últimos 7 dias</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{lastWeek}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Sem ação registrada</p>
          <p className="mt-1 text-3xl font-semibold text-amber-700">{pendingFollowUp}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Acesso rápido</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href="/gestao/ocorrencias" className="text-brand-700 hover:underline">
              Ver todas as ocorrências
            </Link>
          </li>
          <li>
            <Link href="/gestao/turmas" className="text-brand-700 hover:underline">
              Cadastro de turmas
            </Link>
          </li>
          <li>
            <Link href="/gestao/alunos" className="text-brand-700 hover:underline">
              Cadastro e importação de alunos
            </Link>
          </li>
          <li>
            <Link href="/gestao/relatorios" className="text-brand-700 hover:underline">
              Relatórios e exportação Excel
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
