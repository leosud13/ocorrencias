"use client";

import { useEffect, useState } from "react";
import { formatDateTimeBR } from "@/lib/date-time";
import { OCCURRENCE_REASON_LABELS } from "@/lib/occurrence-reasons";

type Classe = { id: string; name: string };

type OccurrencePreview = {
  id: string;
  controlNumber: string;
  occurredAt: string;
  reason: keyof typeof OCCURRENCE_REASON_LABELS;
  schoolClass: { name: string };
};

type StudentDetail = {
  id: string;
  name: string;
  ra: string;
  class: { id: string; name: string };
  _count: { occurrences: number };
  occurrences: OccurrencePreview[];
};

type Props = {
  studentId: string | null;
  classes: Classe[];
  onClose: () => void;
  onTransferred: (message: string) => void;
  onError: (message: string) => void;
};

export function TransferStudentModal({
  studentId,
  classes,
  onClose,
  onTransferred,
  onError,
}: Props) {
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [newClassId, setNewClassId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setDetail(null);
      setNewClassId("");
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);
    fetch(`/api/gestao/students/${studentId}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Erro ao carregar aluno.");
        setDetail(data);
        setNewClassId("");
      })
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (!studentId) return null;

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!detail || !newClassId) return;

    setSaving(true);
    const res = await fetch(`/api/gestao/students/${detail.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: newClassId }),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      onError(data.error || "Não foi possível transferir o aluno.");
      return;
    }

    const dest = classes.find((c) => c.id === newClassId)?.name ?? "nova turma";
    onTransferred(
      `${detail.name} transferido(a) de ${detail.class.name} para ${dest}. ` +
        `${detail._count.occurrences} ocorrência(s) mantidas no histórico.`,
    );
    onClose();
  }

  const availableClasses = classes.filter((c) => c.id !== detail?.class.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-student-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="transfer-student-title" className="text-lg font-semibold text-slate-900">
              Transferir de turma
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              A turma atual do aluno será atualizada. O histórico de ocorrências permanece vinculado ao
              mesmo aluno, com a turma registrada na época de cada ocorrência.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-500">Carregando…</p>}
        {loadError && <p className="mt-6 text-sm text-red-600">{loadError}</p>}

        {detail && !loading && (
          <form onSubmit={handleTransfer} className="mt-6 space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <p>
                <span className="font-medium text-slate-700">Aluno:</span> {detail.name}
              </p>
              <p className="mt-1">
                <span className="font-medium text-slate-700">RA:</span>{" "}
                <span className="font-mono text-xs">{detail.ra}</span>
              </p>
              <p className="mt-1">
                <span className="font-medium text-slate-700">Turma atual:</span> {detail.class.name}
              </p>
              <p className="mt-1">
                <span className="font-medium text-slate-700">Ocorrências no histórico:</span>{" "}
                {detail._count.occurrences}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Nova turma</label>
              <select
                required
                value={newClassId}
                onChange={(e) => setNewClassId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Selecione a turma de destino…</option>
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {detail.occurrences.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-800">Histórico recente</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Cada ocorrência mantém a turma em que foi registrada.
                </p>
                <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Data</th>
                        <th className="px-3 py-2 font-medium">Motivo</th>
                        <th className="px-3 py-2 font-medium">Turma na época</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.occurrences.map((o) => (
                        <tr key={o.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 whitespace-nowrap">
                            {formatDateTimeBR(new Date(o.occurredAt))}
                          </td>
                          <td className="px-3 py-2">{OCCURRENCE_REASON_LABELS[o.reason]}</td>
                          <td className="px-3 py-2">{o.schoolClass.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !newClassId || availableClasses.length === 0}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? "Transferindo…" : "Confirmar transferência"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
