"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTimeBR } from "@/lib/date-time";

export type ActionHistoryItem = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string };
  lastEditedBy: { id: string; name: string } | null;
};

type Props = {
  occurrenceId: string;
  initial: {
    parentName: string | null;
    parentPhone: string | null;
    parentEmail: string | null;
  };
  initialActions: ActionHistoryItem[];
};

function wasEdited(action: ActionHistoryItem) {
  return new Date(action.updatedAt).getTime() - new Date(action.createdAt).getTime() > 1000;
}

export function ManageOccurrencePanel({ occurrenceId, initial, initialActions }: Props) {
  const router = useRouter();
  const [parentName, setParentName] = useState(initial.parentName ?? "");
  const [parentPhone, setParentPhone] = useState(initial.parentPhone ?? "");
  const [parentEmail, setParentEmail] = useState(initial.parentEmail ?? "");
  const [newAction, setNewAction] = useState("");
  const [actions, setActions] = useState(initialActions);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<ActionHistoryItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const sortedActions = useMemo(
    () =>
      [...actions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
          b.id.localeCompare(a.id),
      ),
    [actions],
  );

  async function onSaveContact(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    const res = await fetch(`/api/occurrences/${occurrenceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentName, parentPhone, parentEmail }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Erro ao salvar.");
      return;
    }
    setMsg("Dados do responsável salvos.");
    router.refresh();
  }

  async function onAddAction(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (!newAction.trim()) {
      setErr("Informe a ação tomada.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/occurrences/${occurrenceId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newAction }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || "Erro ao registrar ação.");
      return;
    }
    setActions((prev) => [data as ActionHistoryItem, ...prev]);
    setNewAction("");
    setMsg("Ação registrada no histórico.");
    router.refresh();
  }

  function openEdit(action: ActionHistoryItem) {
    setEditing(action);
    setEditContent(action.content);
    setEditPassword("");
    setEditError(null);
  }

  function closeEdit() {
    if (editLoading) return;
    setEditing(null);
    setEditContent("");
    setEditPassword("");
    setEditError(null);
  }

  async function onConfirmEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);
    if (!editContent.trim()) {
      setEditError("Informe a ação tomada.");
      return;
    }
    if (!editPassword.trim()) {
      setEditError("Informe sua senha para confirmar.");
      return;
    }

    setEditLoading(true);
    const res = await fetch(`/api/occurrences/${occurrenceId}/actions/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent, password: editPassword }),
    });
    setEditLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEditError(data.error || "Não foi possível editar a ação.");
      return;
    }

    setActions((prev) =>
      prev.map((a) => (a.id === editing.id ? (data as ActionHistoryItem) : a)),
    );
    closeEdit();
    setMsg("Ação atualizada.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={onSaveContact}
        className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-6"
      >
        <h2 className="text-lg font-medium text-amber-950">Tratativa / ciência da gestão</h2>
        <p className="text-sm text-amber-900/80">
          Registre contato com a família e as medidas adotadas. O histórico de ações fica visível ao
          professor autor.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome do responsável</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Telefone de contato</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">E-mail do responsável</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {loading ? "Salvando…" : "Salvar dados do responsável"}
        </button>
      </form>

      <section className="space-y-4 rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Histórico de ações</h3>
          <p className="text-sm text-slate-600">
            Cada registro é uma ação. Editar uma ação antiga exige confirmação com senha.
          </p>
        </div>

        <form onSubmit={onAddAction} className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Nova ação / encaminhamento</label>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            placeholder="Descreva a nova ação tomada…"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Salvando…" : "Adicionar ação"}
          </button>
        </form>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}

        {sortedActions.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma ação registrada ainda.</p>
        ) : (
          <ul className="space-y-3">
            {sortedActions.map((action, index) => (
              <li
                key={action.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Ação {sortedActions.length - index}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{action.content}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Criada em {formatDateTimeBR(new Date(action.createdAt))}
                      {action.author?.name ? ` por ${action.author.name}` : ""}
                      {wasEdited(action) && (
                        <>
                          {" · "}
                          Editada em {formatDateTimeBR(new Date(action.updatedAt))}
                          {action.lastEditedBy?.name
                            ? ` por ${action.lastEditedBy.name}`
                            : ""}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(action)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white"
                  >
                    Editar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-action-title"
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="edit-action-title" className="text-lg font-semibold text-slate-900">
                  Editar ação
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Confirme com sua senha para alterar uma ação já registrada.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                disabled={editLoading}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onConfirmEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Ação</label>
                <textarea
                  rows={5}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Digite sua senha para confirmar
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={editLoading}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
                >
                  {editLoading ? "Salvando…" : "Confirmar edição"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
