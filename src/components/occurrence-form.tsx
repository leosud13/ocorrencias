"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentNameSearch } from "@/components/student-name-search";
import { dateTimeInputBRToISOString, formatDateTimeInputBR } from "@/lib/date-time";
import { OCCURRENCE_REASON_OPTIONS } from "@/lib/occurrence-reasons";
import { OCCURRENCE_LOCATION_OPTIONS } from "@/lib/occurrence-locations";
import {
  QuickOccurrencesModal,
  applyQuickOccurrenceTemplate,
} from "@/components/quick-occurrences-modal";

type Classe = { id: string; name: string };

type Props = {
  redirectPath: string;
  title?: string;
  description?: string;
};

export function OccurrenceForm({
  redirectPath,
  title = "Nova ocorrência",
  description = "O número de controle e a data de registro são gerados automaticamente. O nome do autor vem do seu login.",
}: Props) {
  const router = useRouter();
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentLabel, setStudentLabel] = useState("");
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => formatDateTimeInputBR());
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then(setClasses)
      .catch(() => setError("Não foi possível carregar as turmas."));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!studentId) {
      setError("Selecione o aluno na lista de sugestões.");
      return;
    }
    setLoading(true);
    const fd = new FormData();
    fd.set("classId", classId);
    fd.set("studentId", studentId);
    fd.set("reason", reason);
    fd.set("location", location);
    fd.set("occurredAt", dateTimeInputBRToISOString(occurredAt));
    if (details.trim()) fd.set("details", details.trim());
    if (files) {
      for (let i = 0; i < files.length; i++) {
        fd.append("files", files[i]);
      }
    }

    const res = await fetch("/api/occurrences", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Erro ao salvar.");
      return;
    }
    router.push(redirectPath);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 overflow-visible rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Turma (classe)</label>
          <select
            required
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setStudentId("");
              setStudentLabel("");
            }}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <StudentNameSearch
          key={classId || "none"}
          studentId={studentId}
          studentLabel={studentLabel}
          classId={classId || undefined}
          disabled={!classId}
          placeholder={classId ? "Digite o nome do aluno…" : "Escolha primeiro a turma"}
          onSelect={(s) => {
            setStudentId(s?.id ?? "");
            setStudentLabel(s?.name ?? "");
          }}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700">Data da ocorrência</label>
          <input
            type="datetime-local"
            required
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Local da ocorrência</label>
          <select
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione…</option>
            {OCCURRENCE_LOCATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Motivo</label>
          <select
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione…</option>
            {OCCURRENCE_REASON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-sm font-medium text-slate-700">
              Mais informações / detalhes
            </label>
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="rounded-lg border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              Ocorrências rápidas
            </button>
          </div>
          <textarea
            rows={6}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Descreva o contexto com objetividade ou use ocorrências rápidas para inserir um relato padronizado."
          />
        </div>

        <QuickOccurrencesModal
          open={quickOpen}
          onClose={() => setQuickOpen(false)}
          onSelect={(template) => {
            const next = applyQuickOccurrenceTemplate(template, details, reason);
            setDetails(next.details);
            if (next.reason) setReason(next.reason);
          }}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700">Evidências (arquivos)</label>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="mt-1 w-full text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">PDF, imagens, documentos — múltiplos arquivos permitidos.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Salvando…" : "Registrar ocorrência"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
