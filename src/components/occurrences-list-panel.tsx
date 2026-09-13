"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BatchActionModal } from "@/components/batch-action-modal";
import { StudentNameSearch } from "@/components/student-name-search";
import { formatDateInputBR, formatDateTimeBR } from "@/lib/date-time";
import { OCCURRENCE_REASON_LABELS } from "@/lib/occurrence-reasons";
import type { OccurrenceStatusFilter } from "@/lib/occurrence-list-filters";

type Classe = { id: string; name: string };

type OccurrenceRow = {
  id: string;
  controlNumber: string;
  registeredAt: string;
  occurredAt: string;
  reason: keyof typeof OCCURRENCE_REASON_LABELS;
  actionTaken: string | null;
  author: { name: string };
  schoolClass: { name: string };
  student: { id: string; name: string; ra: string };
  attachments?: { id: string }[];
};

type Props = {
  mode: "gestao" | "professor";
};

const PAGE_SIZE = 20;

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: formatDateInputBR(from), to: formatDateInputBR(to) };
}

function statusBadge(actionTaken: string | null) {
  const hasAction = !!(actionTaken && actionTaken.trim());
  if (hasAction) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
        Com ação
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
      Pendente
    </span>
  );
}

export function OccurrencesListPanel({ mode }: Props) {
  const isGestao = mode === "gestao";
  const defaults = useMemo(() => defaultRange(), []);
  const apiPath = isGestao ? "/api/gestao/occurrences" : "/api/occurrences";
  const detailBase = isGestao ? "/gestao/ocorrencias" : "/professor/ocorrencias";
  const newHref = `${detailBase}/nova`;

  const [classes, setClasses] = useState<Classe[]>([]);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [studentId, setStudentId] = useState("");
  const [studentLabel, setStudentLabel] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState<OccurrenceStatusFilter | "">("");
  const [applied, setApplied] = useState({
    from: defaults.from,
    to: defaults.to,
    studentId: "",
    classId: "",
    status: "" as OccurrenceStatusFilter | "",
  });
  const [rows, setRows] = useState<OccurrenceRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedMeta, setSelectedMeta] = useState<
    Record<string, { studentId: string; studentName: string; studentRa: string }>
  >({});
  const [loading, setLoading] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/classes")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch(() => setClasses([]));
  }, []);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (applied.studentId) params.set("studentId", applied.studentId);
    if (applied.classId) params.set("classId", applied.classId);
    if (applied.status) params.set("status", applied.status);
    if (isGestao) {
      if (applied.from) params.set("from", applied.from);
      if (applied.to) params.set("to", applied.to);
    }
    const res = await fetch(`${apiPath}?${params}`);
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Erro ao carregar ocorrências.");
      return;
    }
    setRows(data.items ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
  }, [apiPath, applied, isGestao, page]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters() {
    setSelected(new Set());
    setSelectedMeta({});
    setApplied({ from, to, studentId, classId, status });
    setPage(1);
  }

  const allVisibleSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const selectedStudentInfo = useMemo(() => {
    if (selected.size === 0) return { sameStudent: true, label: null as string | null };
    const metas = [...selected].map((id) => selectedMeta[id]).filter(Boolean);
    if (metas.length !== selected.size) {
      return { sameStudent: false, label: null as string | null };
    }
    const ids = new Set(metas.map((m) => m.studentId));
    if (ids.size !== 1) return { sameStudent: false, label: null as string | null };
    const first = metas[0];
    return {
      sameStudent: true,
      label: `${first.studentName} (RA ${first.studentRa})`,
    };
  }, [selected, selectedMeta]);

  function rememberRows(list: OccurrenceRow[]) {
    setSelectedMeta((prev) => {
      const next = { ...prev };
      for (const row of list) {
        next[row.id] = {
          studentId: row.student.id,
          studentName: row.student.name,
          studentRa: row.student.ra,
        };
      }
      return next;
    });
  }

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const r of rows) next.delete(r.id);
        return next;
      });
      return;
    }
    rememberRows(rows);
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of rows) next.add(r.id);
      return next;
    });
  }

  function toggleOne(id: string) {
    const row = rows.find((r) => r.id === id);
    if (row) rememberRows([row]);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function selectAllFiltered() {
    setError(null);
    setSelectingAll(true);
    const params = new URLSearchParams();
    if (applied.studentId) params.set("studentId", applied.studentId);
    if (applied.classId) params.set("classId", applied.classId);
    if (applied.status) params.set("status", applied.status);
    if (applied.from) params.set("from", applied.from);
    if (applied.to) params.set("to", applied.to);
    const res = await fetch(`/api/gestao/occurrences/ids?${params}`);
    setSelectingAll(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Não foi possível selecionar todas as filtradas.");
      return;
    }
    const ids = Array.isArray(data.ids) ? (data.ids as string[]) : [];
    const items = Array.isArray(data.items)
      ? (data.items as {
          id: string;
          studentId: string;
          studentName: string;
          studentRa: string;
        }[])
      : [];
    setSelected(new Set(ids));
    const meta: Record<string, { studentId: string; studentName: string; studentRa: string }> = {};
    for (const item of items) {
      meta[item.id] = {
        studentId: item.studentId,
        studentName: item.studentName,
        studentRa: item.studentRa,
      };
    }
    setSelectedMeta(meta);
  }

  function printSelected() {
    if (selected.size === 0) return;
    const ids = [...selected].join(",");
    window.open(`/api/occurrences/batch-ficha?ids=${encodeURIComponent(ids)}`, "_blank");
  }

  function openBatchAction() {
    setError(null);
    if (selected.size === 0) {
      setError("Selecione ao menos uma ocorrência.");
      return;
    }
    if (!selectedStudentInfo.sameStudent) {
      setError("Selecione apenas ocorrências do mesmo aluno para registrar uma ação em massa.");
      return;
    }
    setBatchOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isGestao ? "Todas as ocorrências" : "Minhas ocorrências"}
          </h1>
          <p className="text-sm text-slate-600">
            {isGestao
              ? "Filtre por aluno, turma e status. Selecione ocorrências do mesmo aluno para ação em massa ou impressão."
              : "Você visualiza apenas os registros criados por você."}
          </p>
        </div>
        <Link
          href={newHref}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {isGestao ? "Nova ocorrência" : "Registrar nova"}
        </Link>
      </div>

      <section className="overflow-visible rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          className="grid gap-4 overflow-visible sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
        >
          <div className={isGestao ? "" : "sm:col-span-2"}>
            <StudentNameSearch
              key={classId || "all"}
              label="Nome do aluno"
              studentId={studentId}
              studentLabel={studentLabel}
              classId={classId || undefined}
              onSelect={(s) => {
                setStudentId(s?.id ?? "");
                setStudentLabel(s?.name ?? "");
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Turma</label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setStudentId("");
                setStudentLabel("");
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
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OccurrenceStatusFilter | "")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="com_acao">Com ação</option>
            </select>
          </div>
          {isGestao && (
            <>
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
            </>
          )}
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {loading ? "Carregando…" : "Filtrar"}
            </button>
            {isGestao && (
              <>
                <button
                  type="button"
                  disabled={loading || selectingAll || total === 0}
                  onClick={selectAllFiltered}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                >
                  {selectingAll ? "Selecionando…" : `Selecionar todas filtradas (${total})`}
                </button>
                <button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={openBatchAction}
                  className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
                >
                  Registrar ação em massa ({selected.size})
                </button>
                <button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={printSelected}
                  className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                >
                  Imprimir selecionadas ({selected.size})
                </button>
              </>
            )}
          </div>
        </form>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isGestao && (
        <BatchActionModal
          open={batchOpen}
          selectedCount={selected.size}
          selectedIds={[...selected]}
          studentLabel={selectedStudentInfo.label}
          onClose={() => setBatchOpen(false)}
          onSaved={() => {
            setBatchOpen(false);
            setSelected(new Set());
            setSelectedMeta({});
            load();
          }}
        />
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {isGestao && (
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    aria-label="Selecionar todas"
                  />
                </th>
              )}
              <th className="px-4 py-3 font-medium">Nº</th>
              <th className="px-4 py-3 font-medium">Ocorrência</th>
              <th className="px-4 py-3 font-medium">Registro</th>
              {isGestao && <th className="px-4 py-3 font-medium">Autor</th>}
              <th className="px-4 py-3 font-medium">Turma</th>
              <th className="px-4 py-3 font-medium">Aluno</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {!isGestao && <th className="px-4 py-3 font-medium">Anexos</th>}
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={isGestao ? 10 : 9}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Nenhuma ocorrência encontrada com os filtros informados.
                </td>
              </tr>
            )}
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                {isGestao && (
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggleOne(o.id)}
                      aria-label={`Selecionar ${o.controlNumber}`}
                    />
                  </td>
                )}
                <td className="px-4 py-3 font-mono text-xs">{o.controlNumber}</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                  {formatDateTimeBR(new Date(o.occurredAt))}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDateTimeBR(new Date(o.registeredAt))}
                </td>
                {isGestao && <td className="px-4 py-3">{o.author.name}</td>}
                <td className="px-4 py-3">{o.schoolClass.name}</td>
                <td className="px-4 py-3">{o.student.name}</td>
                <td className="px-4 py-3">{OCCURRENCE_REASON_LABELS[o.reason]}</td>
                <td className="px-4 py-3">{statusBadge(o.actionTaken)}</td>
                {!isGestao && (
                  <td className="px-4 py-3">{o.attachments?.length ?? 0}</td>
                )}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {isGestao && (
                    <a
                      href={`/api/occurrences/${o.id}/ficha`}
                      target="_blank"
                      rel="noreferrer"
                      className="mr-3 text-slate-600 hover:underline"
                    >
                      Ficha
                    </a>
                  )}
                  <Link href={`${detailBase}/${o.id}`} className="text-brand-700 hover:underline">
                    {isGestao ? "Abrir" : "Ver"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-600">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}{" "}
              ocorrência(s)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-600">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                disabled={loading || page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
