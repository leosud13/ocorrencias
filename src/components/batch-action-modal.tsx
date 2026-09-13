"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  selectedCount: number;
  studentLabel: string | null;
  onClose: () => void;
  onSaved: () => void;
  selectedIds: string[];
};

export function BatchActionModal({
  open,
  selectedCount,
  studentLabel,
  onClose,
  onSaved,
  selectedIds,
}: Props) {
  const [actionTaken, setActionTaken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setActionTaken("");
    setError(null);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!actionTaken.trim()) {
      setError("Informe a ação tomada.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/gestao/occurrences/batch-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, actionTaken }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Não foi possível registrar a ação em massa.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-action-title"
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="batch-action-title" className="text-lg font-semibold text-slate-900">
              Ação em massa
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Registrar a mesma ação em{" "}
              <span className="font-medium text-slate-900">{selectedCount}</span> ocorrência(s)
              {studentLabel ? (
                <>
                  {" "}
                  de <span className="font-medium text-slate-900">{studentLabel}</span>
                </>
              ) : null}
              . Cada ocorrência recebe uma notificação e a ação entra no histórico.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Ação tomada / encaminhamento
            </label>
            <textarea
              rows={5}
              required
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Descreva a ação única para as ocorrências selecionadas…"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Salvando…" : "Salvar ação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
