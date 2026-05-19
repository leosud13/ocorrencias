"use client";

import { useEffect, useRef, useState } from "react";

export type StudentSearchHit = {
  id: string;
  name: string;
  ra: string;
  class: { name: string };
};

type Props = {
  studentId: string;
  studentLabel: string;
  onSelect: (student: StudentSearchHit | null) => void;
};

export function StudentNameSearch({ studentId, studentLabel, onSelect }: Props) {
  const [query, setQuery] = useState(studentLabel);
  const [hits, setHits] = useState<StudentSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(studentLabel);
  }, [studentLabel, studentId]);

  useEffect(() => {
    const q = query.trim();
    if (studentId && q === studentLabel.trim()) {
      setHits([]);
      return;
    }
    if (q.length < 2) {
      setHits([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/gestao/students/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((rows: StudentSearchHit[]) => {
          setHits(Array.isArray(rows) ? rows : []);
          setOpen(true);
        })
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, studentId, studentLabel]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function clear() {
    setQuery("");
    setHits([]);
    onSelect(null);
  }

  function pick(s: StudentSearchHit) {
    setQuery(s.name);
    setOpen(false);
    onSelect(s);
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-sm font-medium text-slate-700">Aluno</label>
      <div className="mt-1 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (studentId) onSelect(null);
          }}
          onFocus={() => hits.length > 0 && setOpen(true)}
          placeholder="Digite o nome do aluno…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          autoComplete="off"
        />
        {(studentId || query) && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Limpar
          </button>
        )}
      </div>
      {loading && <p className="mt-1 text-xs text-slate-500">Buscando…</p>}
      {open && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {hits.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => pick(s)}
              >
                <span className="font-medium text-slate-900">{s.name}</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {s.class.name} — RA {s.ra}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && query.trim().length >= 2 && hits.length === 0 && (
        <p className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow">
          Nenhum aluno encontrado.
        </p>
      )}
    </div>
  );
}
