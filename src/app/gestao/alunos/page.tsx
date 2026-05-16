"use client";

import { useCallback, useEffect, useState } from "react";

type Classe = { id: string; name: string };
type Student = {
  id: string;
  name: string;
  ra: string;
  class: { id: string; name: string };
};

export default function AlunosPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filterClass, setFilterClass] = useState("");
  const [classId, setClassId] = useState("");
  const [name, setName] = useState("");
  const [ra, setRa] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadClasses() {
    const res = await fetch("/api/gestao/classes");
    if (res.ok) setClasses(await res.json());
  }

  const loadStudents = useCallback(async () => {
    const q = filterClass ? `?classId=${encodeURIComponent(filterClass)}` : "";
    const res = await fetch(`/api/gestao/students${q}`);
    if (res.ok) setStudents(await res.json());
  }, [filterClass]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  async function createStudent(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    setLoading(true);
    const res = await fetch("/api/gestao/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, name, ra }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Erro ao cadastrar.");
      return;
    }
    setMsg("Aluno cadastrado.");
    setName("");
    setRa("");
    loadStudents();
    loadClasses();
  }

  async function removeStudent(id: string) {
    if (!confirm("Excluir este aluno?")) return;
    setError(null);
    const res = await fetch(`/api/gestao/students/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Erro ao excluir.");
      return;
    }
    loadStudents();
    loadClasses();
  }

  async function importFile(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setMsg(null);
    setError(null);
    setLoading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/gestao/students/import", { method: "POST", body: fd });
    setLoading(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "Falha na importação.");
      return;
    }
    setMsg(
      `Importação concluída: ${j.createdStudents} aluno(s), ${j.createdClasses} turma(s) nova(s).` +
        (j.errors?.length ? ` Avisos: ${j.errors.slice(0, 5).join(" ")}` : ""),
    );
    setFile(null);
    loadStudents();
    loadClasses();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Alunos</h1>
        <p className="text-sm text-slate-600">
          Campos obrigatórios: turma, nome e RA. Use a importação em lote com planilhas (.xlsx ou .csv).
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Importação em lote</h2>
        <p className="mt-1 text-sm text-slate-600">
          A primeira linha deve conter os cabeçalhos. Colunas aceitas: <strong>Turma</strong> (ou Classe),{" "}
          <strong>Nome</strong> (ou Aluno), <strong>RA</strong>. Turmas inexistentes serão criadas
          automaticamente.
        </p>
        <form onSubmit={importFile} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button
            type="submit"
            disabled={loading || !file}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
          >
            Enviar planilha
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Cadastro manual</h2>
        <form onSubmit={createStudent} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Turma</label>
            <select
              required
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
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
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome completo</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">RA</label>
            <input
              required
              value={ra}
              onChange={(e) => setRa(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Salvar aluno
            </button>
          </div>
        </form>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-medium text-slate-900">Lista</h2>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todas as turmas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">RA</th>
                <th className="px-4 py-3 font-medium">Turma</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.ra}</td>
                  <td className="px-4 py-3">{s.class.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => removeStudent(s.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
