"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateInputBR } from "@/lib/date-time";
import { OCCURRENCE_REASON_OPTIONS } from "@/lib/occurrence-reasons";

type Classe = { id: string; name: string };
type Aluno = { id: string; name: string; ra: string; class: { name: string } };

type Summary = {
  total: number;
  byReason: { reason: string; label: string; count: number; pct: number }[];
  byClass: { classId: string; className: string; count: number }[];
  byStudent: { studentId: string; studentName: string; ra: string; className: string; count: number }[];
  series: { date: string; count: number }[];
};

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: formatDateInputBR(from), to: formatDateInputBR(to) };
}

function BarList(items: { label: string; count: number; pct?: number }[], max?: number) {
  const top = max ? items.slice(0, max) : items;
  const maxCount = Math.max(1, ...top.map((i) => i.count));
  return (
    <ul className="space-y-3">
      {top.map((i, idx) => (
        <li key={`${i.label}-${idx}`}>
          <div className="flex justify-between text-xs text-slate-600">
            <span className="truncate pr-2">{i.label}</span>
            <span>
              {i.count}
              {i.pct != null ? ` (${i.pct}%)` : ""}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-100">
            <div
              className="h-2 rounded bg-brand-500"
              style={{ width: `${Math.round((i.count / maxCount) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function RelatoriosPage() {
  const defaults = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [classes, setClasses] = useState<Classe[]>([]);
  const [students, setStudents] = useState<Aluno[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/gestao/classes")
      .then((r) => r.json())
      .then(setClasses)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = classId ? `?classId=${encodeURIComponent(classId)}` : "";
    fetch(`/api/gestao/students${q}`)
      .then((r) => r.json())
      .then((rows: Aluno[]) => {
        setStudents(rows);
        setStudentId((cur) => {
          if (cur && rows.some((s) => s.id === cur)) return cur;
          return "";
        });
      })
      .catch(() => setStudents([]));
  }, [classId]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("from", from);
    p.set("to", to);
    if (classId) p.set("classId", classId);
    if (studentId) p.set("studentId", studentId);
    if (reason) p.set("reason", reason);
    return p.toString();
  }, [from, to, classId, studentId, reason]);

  async function loadSummary() {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/gestao/reports/summary?${queryString}`);
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Não foi possível carregar os dados.");
      setSummary(null);
      return;
    }
    setSummary(await res.json());
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportTotalHref = `/api/gestao/reports/export?${queryString}&mode=total`;
  const exportByStudentHref = `/api/gestao/reports/export?${queryString}&mode=by_student`;

  const seriesMax = Math.max(1, ...(summary?.series.map((s) => s.count) ?? []));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Relatórios de ocorrências</h1>
        <p className="text-sm text-slate-600">
          Filtre por período (data da ocorrência), turma, aluno e tipo. Exporte para Excel no formato
          consolidado ou com abas por aluno.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">De (ocorrência)</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Até (ocorrência)</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Turma</label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setStudentId("");
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Aluno</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.ra}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Tipo (motivo)</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {OCCURRENCE_REASON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadSummary}
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Atualizando…" : "Aplicar filtros"}
          </button>
          <a
            href={exportTotalHref}
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Baixar Excel (total)
          </a>
          <a
            href={exportByStudentHref}
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Baixar Excel (por aluno)
          </a>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total no período</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900">{summary.total}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
              <p className="text-sm font-medium text-slate-700">Ocorrências por dia (data da ocorrência)</p>
              <div className="mt-3 flex h-28 items-end gap-px overflow-x-auto">
                {summary.series.length === 0 ? (
                  <span className="text-sm text-slate-500">Sem dados.</span>
                ) : (
                  summary.series.map((s) => (
                    <div key={s.date} className="flex min-w-[10px] flex-1 flex-col items-center justify-end">
                      <div
                        className="w-full max-w-[14px] rounded-t bg-brand-400"
                        style={{ height: `${Math.max(4, (s.count / seriesMax) * 100)}%` }}
                        title={`${s.date}: ${s.count}`}
                      />
                      <span className="mt-1 rotate-45 origin-top-left text-[9px] text-slate-500 whitespace-nowrap">
                        {s.date.slice(5)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Por tipo</h2>
              <div className="mt-3">
                {BarList(
                  summary.byReason.map((r) => ({ label: r.label, count: r.count, pct: r.pct })),
                  12,
                )}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Por turma</h2>
              <div className="mt-3">
                {BarList(
                  summary.byClass.map((c) => ({ label: c.className, count: c.count })),
                  12,
                )}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
              <h2 className="text-sm font-semibold text-slate-900">Por aluno (top 12)</h2>
              <div className="mt-3">
                {BarList(
                  summary.byStudent.map((s) => ({
                    label: `${s.studentName} (${s.ra})`,
                    count: s.count,
                  })),
                  12,
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Aluno</th>
                  <th className="px-4 py-3 font-medium">RA</th>
                  <th className="px-4 py-3 font-medium">Turma</th>
                  <th className="px-4 py-3 font-medium">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {summary.byStudent.map((s) => (
                  <tr key={s.studentId} className="border-t border-slate-100">
                    <td className="px-4 py-2">{s.studentName}</td>
                    <td className="px-4 py-2 font-mono text-xs">{s.ra}</td>
                    <td className="px-4 py-2">{s.className}</td>
                    <td className="px-4 py-2">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
