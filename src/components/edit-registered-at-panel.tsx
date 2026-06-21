"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTimeBR, formatDateTimeInputBR } from "@/lib/date-time";

type Props = {
  occurrenceId: string;
  initialRegisteredAt: string;
  canEdit: boolean;
};

export function EditRegisteredAtPanel({
  occurrenceId,
  initialRegisteredAt,
  canEdit,
}: Props) {
  const router = useRouter();
  const initialDate = new Date(initialRegisteredAt);
  const [registeredAt, setRegisteredAt] = useState(formatDateTimeInputBR(initialDate));
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!canEdit) {
    return <span className="text-sm text-slate-900">{formatDateTimeBR(initialDate)}</span>;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    const res = await fetch(`/api/occurrences/${occurrenceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registeredAt }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Erro ao salvar data de registro.");
      return;
    }
    setMsg("Data de registro atualizada.");
    router.refresh();
  }

  return (
    <form onSubmit={onSave} className="space-y-2">
      <input
        type="datetime-local"
        value={registeredAt}
        onChange={(e) => setRegisteredAt(e.target.value)}
        className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {loading ? "Salvando…" : "Salvar data"}
        </button>
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
    </form>
  );
}
