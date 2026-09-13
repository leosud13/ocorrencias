import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDateTimeBR } from "@/lib/date-time";
import { OCCURRENCE_REASON_LABELS } from "@/lib/occurrence-reasons";
import { OCCURRENCE_LOCATION_LABELS } from "@/lib/occurrence-locations";
import { OccurrenceActivityPanel } from "@/components/occurrence-activity-panel";
import { EditRegisteredAtPanel } from "@/components/edit-registered-at-panel";
import { canContributeToOccurrence, canViewOccurrence } from "@/lib/occurrence-access";

type Props = { params: { id: string } };

export default async function ProfessorOccurrenceDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const o = await prisma.occurrence.findUnique({
    where: { id: params.id },
    include: {
      author: true,
      schoolClass: true,
      student: true,
      attachments: { orderBy: { createdAt: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, role: true } } },
      },
      actions: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          author: { select: { id: true, name: true } },
          lastEditedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!o) notFound();
  if (!canViewOccurrence(session.user, o)) {
    redirect("/professor/ocorrencias");
  }

  return (
    <div className="space-y-6">
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
            Ficha para impressão
          </a>
          <Link href="/professor/ocorrencias" className="text-sm text-brand-700 hover:underline">
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
          <dd className="text-sm text-slate-900">
            <EditRegisteredAtPanel
              occurrenceId={o.id}
              initialRegisteredAt={o.registeredAt.toISOString()}
              canEdit={canContributeToOccurrence(session.user, o)}
            />
          </dd>
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
          <dt className="text-xs font-medium uppercase text-slate-500">Local</dt>
          <dd className="text-sm text-slate-900">{OCCURRENCE_LOCATION_LABELS[o.location]}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Motivo</dt>
          <dd className="text-sm text-slate-900">{OCCURRENCE_REASON_LABELS[o.reason]}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-slate-500">Detalhes</dt>
          <dd className="text-sm text-slate-900 whitespace-pre-wrap">{o.details || "—"}</dd>
        </div>
      </dl>

      <OccurrenceActivityPanel
        occurrenceId={o.id}
        initialComments={o.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          author: comment.author,
        }))}
        initialAttachments={o.attachments.map((attachment) => ({
          id: attachment.id,
          fileName: attachment.fileName,
          sizeBytes: attachment.sizeBytes,
          createdAt: attachment.createdAt.toISOString(),
        }))}
        canContribute={canContributeToOccurrence(session.user, o)}
      />

      {(o.parentName || o.parentPhone || o.parentEmail || o.actions.length > 0 || o.actionTaken) && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6">
          <h2 className="text-lg font-medium text-emerald-900">Retorno da gestão</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs font-medium text-emerald-800">Responsável</dt>
              <dd>{o.parentName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-emerald-800">Telefone</dt>
              <dd>{o.parentPhone || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-emerald-800">E-mail</dt>
              <dd>{o.parentEmail || "—"}</dd>
            </div>
          </dl>
          <div className="mt-4 space-y-3">
            <h3 className="text-sm font-medium text-emerald-900">Histórico de ações</h3>
            {o.actions.length === 0 ? (
              <p className="whitespace-pre-wrap text-sm text-emerald-950">{o.actionTaken || "—"}</p>
            ) : (
              <ul className="space-y-3">
                {o.actions.map((action, index) => {
                  const edited =
                    new Date(action.updatedAt).getTime() - new Date(action.createdAt).getTime() >
                    1000;
                  return (
                    <li
                      key={action.id}
                      className="rounded-lg border border-emerald-200 bg-white/70 px-3 py-2"
                    >
                      <p className="text-xs font-medium uppercase text-emerald-800">
                        Ação {o.actions.length - index}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-950">
                        {action.content}
                      </p>
                      <p className="mt-1 text-xs text-emerald-800/80">
                        Criada em {formatDateTimeBR(action.createdAt)}
                        {edited && <> · Editada em {formatDateTimeBR(action.updatedAt)}</>}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
