"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  occurrenceId: string;
  initial: {
    parentName: string | null;
    parentPhone: string | null;
    parentEmail: string | null;
    actionTaken: string | null;
  };
};

export function ManageOccurrencePanel({ occurrenceId, initial }: Props) {
  const router = useRouter();
  const [parentName, setParentName] = useState(initial.parentName ?? "");
  const [parentPhone, setParentPhone] = useState(initial.parentPhone ?? "");
  const [parentEmail, setParentEmail] = useState(initial.parentEmail ?? "");
  const [actionTaken, setActionTaken] = useState(initial.actionTaken ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    const res = await fetch(`/api/occurrences/${occurrenceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentName, parentPhone, parentEmail, actionTaken }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Erro ao salvar.");
      return;
    }
    setMsg("Informações salvas.");
    router.refresh();
  }

  return (
    <form onSubmit={onSave} className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-6">
      <h2 className="text-lg font-medium text-amber-950">Tratativa / ciência da gestão</h2>
      <p className="text-sm text-amber-900/80">
        Registre contato com a família e as medidas adotadas. Estes dados ficam visíveis ao professor
        autor quando preenchidos.
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
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Ação tomada / encaminhamento</label>
          <textarea
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
          />
        </div>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
      >
        {loading ? "Salvando…" : "Salvar tratativa"}
      </button>
    </form>
  );
}
