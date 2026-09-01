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
  classId?: string;
  onSelect: (student: StudentSearchHit | null) => void;
};

export function StudentNameSearch({ studentId, studentLabel, classId, onSelect }: Props) {
  const [query, setQuery] = useState(studentLabel);
  const [hits, setHits] = useState<StudentSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    setQuery(studentLabel);
  }, [studentLabel]);

  useEffect(() => {
    const q = query.trim();
    if (studentId && q === studentLabel.trim()) {
      setHits([]);
      setOpen(false);
      return;
    }
    if (q.length < 1) {
      setHits([]);
      setOpen(false);
      return;
    }

    setOpen(true);

    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ q });
      if (classId) params.set("classId", classId);
      fetch(`/api/gestao/students/search?${params}`)
        .then((r) => r.json())
        .then((rows: StudentSearchHit[]) => {
          setHits(Array.isArray(rows) ? rows : []);
          setOpen(true);
        })
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, studentId, studentLabel, classId]);

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
    skipSearchRef.current = true;
    setQuery("");
    setHits([]);
    setOpen(false);
    onSelect(null);
  }

  function pick(s: StudentSearchHit) {
    skipSearchRef.current = true;
    setQuery(s.name);
    setHits([]);
    setOpen(false);
    onSelect(s);
  }

  const showDropdown = open && query.trim().length >= 1;

  return (
    <div ref={wrapRef} className="relative z-30">
      <label className="block text-sm font-medium text-slate-700">Aluno</label>
      <div className="mt-1 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              if (studentId) onSelect(null);
              if (next.trim().length >= 1) setOpen(true);
            }}
            onFocus={() => {
              if (query.trim().length >= 1) setOpen(true);
            }}
            placeholder="Digite o nome do aluno…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
          />
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1">
              {loading && hits.length === 0 && (
                <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-lg">
                  Buscando…
                </p>
              )}
              {!loading && hits.length > 0 && (
                <ul className="max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  {hits.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onMouseDown={(e) => e.preventDefault()}
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
              {!loading && hits.length === 0 && (
                <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-lg">
                  Nenhum aluno encontrado.
                </p>
              )}
            </div>
          )}
        </div>
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
    </div>
  );
}
