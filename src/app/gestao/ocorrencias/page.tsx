import Link from "next/link";
import { prisma } from "@/lib/db";
import { OCCURRENCE_REASON_LABELS } from "@/lib/occurrence-reasons";

export default async function GestaoOccurrencesPage() {
  const rows = await prisma.occurrence.findMany({
    orderBy: { registeredAt: "desc" },
    include: {
      author: { select: { name: true } },
      schoolClass: true,
      student: true,
      attachments: true,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Todas as ocorrências</h1>
          <p className="text-sm text-slate-600">Lista completa da escola — clique para dar andamento.</p>
        </div>
        <Link
          href="/gestao/ocorrencias/nova"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Nova ocorrência
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Nº</th>
              <th className="px-4 py-3 font-medium">Registro</th>
              <th className="px-4 py-3 font-medium">Autor</th>
              <th className="px-4 py-3 font-medium">Turma</th>
              <th className="px-4 py-3 font-medium">Aluno</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
              <th className="px-4 py-3 font-medium">Tratativa</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma ocorrência cadastrada.
                </td>
              </tr>
            )}
            {rows.map((o) => {
              const hasAction = !!(o.actionTaken && o.actionTaken.trim());
              return (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">{o.controlNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {o.registeredAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3">{o.author.name}</td>
                  <td className="px-4 py-3">{o.schoolClass.name}</td>
                  <td className="px-4 py-3">{o.student.name}</td>
                  <td className="px-4 py-3">{OCCURRENCE_REASON_LABELS[o.reason]}</td>
                  <td className="px-4 py-3">
                    {hasAction ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        Com ação
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/gestao/ocorrencias/${o.id}`} className="text-brand-700 hover:underline">
                      Abrir
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
