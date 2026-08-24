"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  occurrenceId: string;
  controlNumber: string;
};

export function DeleteOccurrenceButton({ occurrenceId, controlNumber }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading]);

  function close() {
    if (loading) return;
    setOpen(false);
    setPassword("");
    setError(null);
  }

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password.trim()) {
      setError("Informe sua senha para confirmar.");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/occurrences/${occurrenceId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Não foi possível excluir a ocorrência.");
      return;
    }

    router.push("/gestao/ocorrencias");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setPassword("");
          setError(null);
        }}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Excluir ocorrência
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-occurrence-title"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="delete-occurrence-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Excluir ocorrência?
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Esta ação é permanente. A ocorrência{" "}
                  <span className="font-mono font-medium text-slate-900">{controlNumber}</span>
                  , incluindo comentários e anexos, será removida.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={loading}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onConfirm} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Digite sua senha para confirmar
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-red-500 focus:ring-2"
                  placeholder="Senha do usuário logado"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex flex-wrap justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={close}
                  disabled={loading}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {loading ? "Excluindo…" : "Confirmar exclusão"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
