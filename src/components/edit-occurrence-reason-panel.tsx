"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OccurrenceReason } from "@prisma/client";
import { OCCURRENCE_REASON_OPTIONS, formatOccurrenceReason } from "@/lib/occurrence-reasons";

type Props = {
  occurrenceId: string;
  initialReason: OccurrenceReason;
  initialReasonOther: string | null;
  canEdit: boolean;
};

export function EditOccurrenceReasonPanel({
  occurrenceId,
  initialReason,
  initialReasonOther,
  canEdit,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState<OccurrenceReason>(initialReason);
  const [reasonOther, setReasonOther] = useState(initialReasonOther ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!canEdit) {
    return (
      <span className="text-sm text-slate-900">
        {formatOccurrenceReason(initialReason, initialReasonOther)}
      </span>
    );
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (reason === "OUTROS" && !reasonOther.trim()) {
      setErr("Descreva o motivo em Outros.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/occurrences/${occurrenceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason,
        reasonOther: reason === "OUTROS" ? reasonOther.trim() : null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Erro ao atualizar o motivo.");
      return;
    }
    setMsg("Motivo atualizado.");
    router.refresh();
  }

  return (
    <form onSubmit={onSave} className="space-y-2">
      <select
        value={reason}
        onChange={(e) => {
          const next = e.target.value as OccurrenceReason;
          setReason(next);
          if (next !== "OUTROS") setReasonOther("");
        }}
        className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        {OCCURRENCE_REASON_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {reason === "OUTROS" && (
        <input
          type="text"
          required
          value={reasonOther}
          onChange={(e) => setReasonOther(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Descreva o motivo…"
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {loading ? "Salvando…" : "Salvar motivo"}
        </button>
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
    </form>
  );
}
