import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDateTimeBR } from "@/lib/date-time";
import { OCCURRENCE_REASON_LABELS } from "@/lib/occurrence-reasons";
import { ManageOccurrencePanel } from "@/components/manage-occurrence-panel";

type Props = { params: { id: string } };

export default async function GestaoOccurrenceDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session?.user || session.user.role !== UserRole.GESTAO) redirect("/login");

  const o = await prisma.occurrence.findUnique({
    where: { id: params.id },
    include: {
      author: true,
      schoolClass: true,
      student: true,
      attachments: true,
    },
  });

  if (!o) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Nº de controle</p>
          <h1 className="text-2xl font-semibold text-slate-900 font-mono">{o.controlNumber}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/api/occurrences/${o.id}/ficha`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
          >
            Ficha para impressão (assinaturas)
          </a>
          <Link href="/gestao/ocorrencias" className="text-sm text-brand-700 hover:underline">
            ← Voltar à lista
          </Link>
        </div>
      </div>

      <dl className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Autor do registro</dt>
          <dd className="text-sm text-slate-900">{o.author.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Data de registro</dt>
          <dd className="text-sm text-slate-900">{formatDateTimeBR(o.registeredAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Data da ocorrência</dt>
          <dd className="text-sm text-slate-900">{formatDateTimeBR(o.occurredAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Turma</dt>
          <dd className="text-sm text-slate-900">{o.schoolClass.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Aluno</dt>
          <dd className="text-sm text-slate-900">
            {o.student.name} <span className="text-slate-500">(RA {o.student.ra})</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Motivo</dt>
          <dd className="text-sm text-slate-900">{OCCURRENCE_REASON_LABELS[o.reason]}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-slate-500">Detalhes informados pelo professor</dt>
          <dd className="text-sm text-slate-900 whitespace-pre-wrap">{o.details || "—"}</dd>
        </div>
      </dl>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Evidências</h2>
        {o.attachments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhum arquivo anexado.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {o.attachments.map((a) => (
              <li key={a.id}>
                <a
                  className="text-brand-700 hover:underline"
                  href={`/api/attachments/${a.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {a.fileName}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ManageOccurrencePanel
        occurrenceId={o.id}
        initial={{
          parentName: o.parentName,
          parentPhone: o.parentPhone,
          parentEmail: o.parentEmail,
          actionTaken: o.actionTaken,
        }}
      />
    </div>
  );
}
