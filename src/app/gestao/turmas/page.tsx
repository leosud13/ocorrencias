"use client";

import { useEffect, useState } from "react";

type Classe = {
  id: string;
  name: string;
  _count: { students: number; occurrences: number };
};

export default function TurmasPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/gestao/classes");
    if (!res.ok) return;
    setClasses(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/gestao/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Erro ao criar turma.");
      return;
    }
    setName("");
    load();
  }

  async function rename(id: string, newName: string) {
    setError(null);
    const res = await fetch(`/api/gestao/classes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Erro ao renomear.");
      return;
    }
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta turma? Só é permitido se não houver alunos nem ocorrências vinculadas.")) return;
    setError(null);
    const res = await fetch(`/api/gestao/classes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Não foi possível excluir.");
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Turmas (classes)</h1>
        <p className="text-sm text-slate-600">Cadastro usado pelos professores ao registrar ocorrências.</p>
      </div>

      <form onSubmit={create} className="flex max-w-xl flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <label className="block text-sm font-medium text-slate-700">Nova turma</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: 8º Ano C"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Alunos</th>
              <th className="px-4 py-3 font-medium">Ocorrências</th>
              <th className="px-4 py-3 font-medium">Renomear</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma turma cadastrada.
                </td>
              </tr>
            )}
            {classes.map((c) => (
              <Row key={c.id} c={c} onRename={rename} onDelete={remove} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  c,
  onRename,
  onDelete,
}: {
  c: Classe;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [edit, setEdit] = useState(c.name);

  useEffect(() => {
    setEdit(c.name);
  }, [c.name]);

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
      <td className="px-4 py-3">{c._count.students}</td>
      <td className="px-4 py-3">{c._count.occurrences}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <input
            className="w-40 rounded border border-slate-300 px-2 py-1 text-xs"
            value={edit}
            onChange={(e) => setEdit(e.target.value)}
          />
          <button
            type="button"
            className="text-xs text-brand-700 hover:underline"
            onClick={() => onRename(c.id, edit)}
          >
            Salvar
          </button>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => onDelete(c.id)}>
          Excluir
        </button>
      </td>
    </tr>
  );
}
