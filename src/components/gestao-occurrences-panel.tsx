"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateInputBR, formatDateTimeBR } from "@/lib/date-time";
import { OCCURRENCE_REASON_LABELS } from "@/lib/occurrence-reasons";
import { StudentNameSearch, type StudentSearchHit } from "@/components/student-name-search";

type OccurrenceRow = {
  id: string;
  controlNumber: string;
  registeredAt: string;
  occurredAt: string;
  reason: keyof typeof OCCURRENCE_REASON_LABELS;
  actionTaken: string | null;
  author: { name: string };
  schoolClass: { name: string };
  student: { name: string; ra: string };
};

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: formatDateInputBR(from), to: formatDateInputBR(to) };
}

export function GestaoOccurrencesPanel() {
  const defaults = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [studentId, setStudentId] = useState("");
  const [studentLabel, setStudentLabel] = useState("");
  const [rows, setRows] = useState<OccurrenceRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (studentId) params.set("studentId", studentId);
    const res = await fetch(`/api/gestao/occurrences?${params}`);
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Erro ao carregar ocorrências.");
      return;
    }
    setRows(data);
    setSelected(new Set());
  }, [from, to, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  function onStudentSelect(s: StudentSearchHit | null) {
    if (!s) {
      setStudentId("");
      setStudentLabel("");
      return;
    }
    setStudentId(s.id);
    setStudentLabel(s.name);
  }

  const allVisibleSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(rows.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function printSelected() {
    if (selected.size === 0) return;
    const ids = [...selected].join(",");
    window.open(`/api/occurrences/batch-ficha?ids=${encodeURIComponent(ids)}`, "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Todas as ocorrências</h1>
          <p className="text-sm text-slate-600">
            Filtre por período e aluno. Selecione ocorrências para imprimir fichas em um único PDF.
          </p>
        </div>
        <Link
          href="/gestao/ocorrencias/nova"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Nova ocorrência
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">Data inicial</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Data final</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <StudentNameSearch
              studentId={studentId}
              studentLabel={studentLabel}
              onSelect={onStudentSelect}
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {loading ? "Carregando…" : "Filtrar"}
            </button>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={printSelected}
              className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
            >
              Imprimir selecionadas ({selected.size})
            </button>
          </div>
        </form>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAll}
                  aria-label="Selecionar todas"
                />
              </th>
              <th className="px-4 py-3 font-medium">Nº</th>
              <th className="px-4 py-3 font-medium">Ocorrência</th>
              <th className="px-4 py-3 font-medium">Registro</th>
              <th className="px-4 py-3 font-medium">Autor</th>
              <th className="px-4 py-3 font-medium">Turma</th>
              <th className="px-4 py-3 font-medium">Aluno</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
              <th className="px-4 py-3 font-medium">Tratativa</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma ocorrência encontrada com os filtros informados.
                </td>
              </tr>
            )}
            {rows.map((o) => {
              const hasAction = !!(o.actionTaken && o.actionTaken.trim());
              return (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggleOne(o.id)}
                      aria-label={`Selecionar ${o.controlNumber}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{o.controlNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {formatDateTimeBR(new Date(o.occurredAt))}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDateTimeBR(new Date(o.registeredAt))}
                  </td>
                  <td className="px-4 py-3">{o.author.name}</td>
                  <td className="px-4 py-3">{o.schoolClass.name}</td>
                  <td className="px-4 py-3">{o.student.name}</td>
                  <td className="px-4 py-3">{OCCURRENCE_REASON_LABELS[o.reason]}</td>
                  <td className="px-4 py-3">
                    {hasAction ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        Com ação
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <a
                      href={`/api/occurrences/${o.id}/ficha`}
                      target="_blank"
                      rel="noreferrer"
                      className="mr-3 text-slate-600 hover:underline"
                    >
                      Ficha
                    </a>
                    <Link href={`/gestao/ocorrencias/${o.id}`} className="text-brand-700 hover:underline">
                      Abrir
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
