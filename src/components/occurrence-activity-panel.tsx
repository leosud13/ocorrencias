"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { formatDateTimeBR } from "@/lib/date-time";
import { USER_ROLE_LABELS } from "@/lib/user-roles";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; role: UserRole };
};

type Attachment = {
  id: string;
  fileName: string;
  sizeBytes: number;
  createdAt: string;
};

type Props = {
  occurrenceId: string;
  initialComments: Comment[];
  initialAttachments: Attachment[];
  canContribute: boolean;
};

export function OccurrenceActivityPanel({
  occurrenceId,
  initialComments,
  initialAttachments,
  canContribute,
}: Props) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onAddComment(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;

    setMsg(null);
    setErr(null);
    setCommentLoading(true);
    const res = await fetch(`/api/occurrences/${occurrenceId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    setCommentLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || "Erro ao adicionar comentário.");
      return;
    }
    setComments((prev) => [...prev, data]);
    setContent("");
    setMsg("Comentário adicionado.");
    router.refresh();
  }

  async function onAddAttachments(e: React.FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;

    setMsg(null);
    setErr(null);
    setAttachmentLoading(true);
    const fd = new FormData();
    for (const file of Array.from(files)) {
      fd.append("files", file);
    }
    const res = await fetch(`/api/occurrences/${occurrenceId}/attachments`, {
      method: "POST",
      body: fd,
    });
    setAttachmentLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || "Erro ao anexar arquivos.");
      return;
    }
    setAttachments((prev) => [...prev, ...(data.items ?? [])]);
    setFiles(null);
    (e.target as HTMLFormElement).reset();
    setMsg("Arquivo(s) anexado(s).");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Comentários</h2>
        <p className="mt-1 text-sm text-slate-600">
          Registre novas informações sobre esta ocorrência. O histórico fica visível para quem tem
          acesso ao registro.
        </p>

        {comments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nenhum comentário adicional ainda.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">
                    {comment.author.name}
                    <span className="ml-2 font-normal text-slate-500">
                      ({USER_ROLE_LABELS[comment.author.role]})
                    </span>
                  </p>
                  <time className="text-xs text-slate-500">
                    {formatDateTimeBR(new Date(comment.createdAt))}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-slate-800">{comment.content}</p>
              </li>
            ))}
          </ul>
        )}

        {canContribute && (
          <form onSubmit={onAddComment} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            <label className="block text-sm font-medium text-slate-700">Novo comentário</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva novas informações, encaminhamentos ou atualizações…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={commentLoading || !content.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {commentLoading ? "Salvando…" : "Adicionar comentário"}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Anexos</h2>
        {attachments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhum arquivo anexado.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {attachments.map((attachment) => (
              <li key={attachment.id}>
                <a
                  className="text-brand-700 hover:underline"
                  href={`/api/attachments/${attachment.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {attachment.fileName}
                </a>
                <span className="ml-2 text-xs text-slate-400">
                  ({(attachment.sizeBytes / 1024).toFixed(1)} KB ·{" "}
                  {formatDateTimeBR(new Date(attachment.createdAt))})
                </span>
              </li>
            ))}
          </ul>
        )}

        {canContribute && (
          <form
            onSubmit={onAddAttachments}
            className="mt-4 space-y-3 border-t border-slate-100 pt-4"
          >
            <label className="block text-sm font-medium text-slate-700">Anexar arquivos</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
            <button
              type="submit"
              disabled={attachmentLoading || !files || files.length === 0}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              {attachmentLoading ? "Enviando…" : "Anexar arquivos"}
            </button>
          </form>
        )}
      </section>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
    </div>
  );
}
