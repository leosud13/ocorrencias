import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { OCCURRENCE_REASON_LABELS } from "@/lib/occurrence-reasons";

export default async function ProfessorOccurrencesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const rows = await prisma.occurrence.findMany({
    where: { authorId: session.user.id },
    orderBy: { registeredAt: "desc" },
    include: {
      schoolClass: true,
      student: true,
      attachments: true,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Minhas ocorrências</h1>
          <p className="text-sm text-slate-600">
            Você visualiza apenas os registros criados por você.
          </p>
        </div>
        <Link
          href="/professor/ocorrencias/nova"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Registrar nova
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Nº controle</th>
              <th className="px-4 py-3 font-medium">Data registro</th>
              <th className="px-4 py-3 font-medium">Data ocorrência</th>
              <th className="px-4 py-3 font-medium">Turma</th>
              <th className="px-4 py-3 font-medium">Aluno</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
              <th className="px-4 py-3 font-medium">Anexos</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma ocorrência registrada ainda.
                </td>
              </tr>
            )}
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{o.controlNumber}</td>
                <td className="px-4 py-3">
                  {o.registeredAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3">
                  {o.occurredAt.toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">{o.schoolClass.name}</td>
                <td className="px-4 py-3">{o.student.name}</td>
                <td className="px-4 py-3">{OCCURRENCE_REASON_LABELS[o.reason]}</td>
                <td className="px-4 py-3">{o.attachments.length}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/professor/ocorrencias/${o.id}`} className="text-brand-700 hover:underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
