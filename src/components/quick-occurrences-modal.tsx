"use client";

import { useMemo, useState } from "react";
import { QUICK_OCCURRENCE_TEMPLATES, type QuickOccurrenceTemplate } from "@/lib/quick-occurrence-templates";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (template: QuickOccurrenceTemplate) => void;
};

export function QuickOccurrencesModal({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_OCCURRENCE_TEMPLATES;
    return QUICK_OCCURRENCE_TEMPLATES.filter(
      (item) =>
        item.title.toLowerCase().includes(q) || item.text.toLowerCase().includes(q),
    );
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Ocorrências rápidas</h2>
          <p className="mt-1 text-sm text-slate-600">
            Selecione um relato padronizado. O texto será incluído em detalhes para você complementar.
          </p>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por tipo de ocorrência…"
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            autoFocus
          />
        </div>

        <ul className="overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-slate-500">
              Nenhum modelo encontrado.
            </li>
          )}
          {filtered.map((item) => {
            const number =
              QUICK_OCCURRENCE_TEMPLATES.findIndex((entry) => entry.id === item.id) + 1;
            return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(item);
                  onClose();
                  setQuery("");
                }}
                className="w-full rounded-lg px-3 py-3 text-left hover:bg-brand-50"
              >
                <span className="text-sm font-medium text-slate-900">
                  {number}. {item.title}
                </span>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.text}</p>
              </button>
            </li>
            );
          })}
        </ul>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export function applyQuickOccurrenceTemplate(
  template: QuickOccurrenceTemplate,
  currentDetails: string,
  currentReason: string,
): { details: string; reason: string } {
  const trimmed = currentDetails.trim();
  const details = trimmed ? `${template.text}\n\n${trimmed}` : template.text;
  const reason =
    currentReason || (template.suggestedReason ? template.suggestedReason : "");

  return { details, reason };
}
