"use client";

import { useCallback, useEffect, useState } from "react";
import { TransferStudentModal } from "@/components/transfer-student-modal";

type Classe = { id: string; name: string };
type Student = {
  id: string;
  name: string;
  ra: string;
  class: { id: string; name: string };
  _count: { occurrences: number };
};

const PAGE_SIZE = 20;

export default function AlunosPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(false);
  const [classId, setClassId] = useState("");
  const [importClassId, setImportClassId] = useState("");
  const [name, setName] = useState("");
  const [ra, setRa] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [transferStudentId, setTransferStudentId] = useState<string | null>(null);

  async function loadClasses() {
    const res = await fetch("/api/gestao/classes");
    if (res.ok) setClasses(await res.json());
  }

  const loadStudents = useCallback(async () => {
    setListLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    const res = await fetch(`/api/gestao/students?${params}`);
    setListLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setStudents(data.items ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
  }, [page, searchQuery]);

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

  function downloadImportTemplate() {
    const csv = "Nome do aluno;RA;Dig. RA\nJoão da Silva;123456789;0\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-importacao-alunos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !importClassId) return;
    setMsg(null);
    setError(null);
    setLoading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("classId", importClassId);
    const res = await fetch("/api/gestao/students/import", { method: "POST", body: fd });
    setLoading(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "Falha na importação.");
      return;
    }
    const turmaLabel = j.turma ? ` (turma ${j.turma})` : "";
    const avisos = j.errors?.length ? j.errors.slice(0, 8).join(" ") : "";
    if (j.createdStudents === 0 && j.errors?.length) {
      setError(
        `Nenhum aluno foi cadastrado${turmaLabel}. ${avisos}` +
          (j.errors.length > 8 ? ` (+${j.errors.length - 8} avisos)` : ""),
      );
      return;
    }
    setMsg(
      `Importação concluída${turmaLabel}: ${j.createdStudents} aluno(s) cadastrado(s).` +
        (avisos ? ` Avisos: ${avisos}` : "") +
        (j.errors?.length > 8 ? ` (+${j.errors.length - 8} avisos)` : ""),
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
          Alunos podem ser transferidos de turma mantendo o histórico de ocorrências.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Importação em lote</h2>
        <p className="mt-1 text-sm text-slate-600">
          Selecione a turma antes de enviar o arquivo. A planilha não deve conter coluna de turma — todos os
          alunos serão vinculados à turma escolhida. Aceita o modelo simples ou exportações do sistema escolar
          (com título e colunas extras, ex.: Nº de chamada, UF RA, Situação).
        </p>

        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">Modelo ideal da planilha</p>
          <p className="mt-1 text-xs text-slate-600">
            Primeira linha com cabeçalhos. O RA final é formado pela concatenação das colunas{" "}
            <strong>RA</strong> + <strong>Dig. RA</strong> (somente dígitos).
          </p>
          <table className="mt-3 w-full max-w-md text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-1.5 pr-3 font-medium">Nome do aluno</th>
                <th className="py-1.5 pr-3 font-medium">RA</th>
                <th className="py-1.5 font-medium">Dig. RA</th>
              </tr>
            </thead>
            <tbody className="font-mono text-slate-800">
              <tr>
                <td className="py-1.5 pr-3">João da Silva</td>
                <td className="py-1.5 pr-3">123456789</td>
                <td className="py-1.5">0</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">Exemplo: RA final = 1234567890</p>
          <button
            type="button"
            onClick={downloadImportTemplate}
            className="mt-3 text-sm font-medium text-brand-600 hover:underline"
          >
            Baixar modelo (.csv)
          </button>
        </div>

        <form onSubmit={importFile} className="mt-4 space-y-4">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-slate-700">Turma</label>
            <select
              required
              value={importClassId}
              onChange={(e) => setImportClassId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione a turma…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="submit"
              disabled={loading || !file || !importClassId}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              Enviar planilha
            </button>
          </div>
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
        <div className="flex flex-wrap items-end gap-3">
          <h2 className="text-lg font-medium text-slate-900">Lista</h2>
          <div className="min-w-[220px] flex-1 max-w-md">
            <label className="block text-sm font-medium text-slate-700">Pesquisar</label>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Nome, RA ou turma…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">RA</th>
                <th className="px-4 py-3 font-medium">Turma</th>
                <th className="px-4 py-3 font-medium">Ocorrências</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    {listLoading
                      ? "Carregando…"
                      : searchQuery.trim()
                        ? "Nenhum aluno encontrado para a pesquisa."
                        : "Nenhum aluno cadastrado."}
                  </td>
                </tr>
              )}
              {students.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.ra}</td>
                  <td className="px-4 py-3">{s.class.name}</td>
                  <td className="px-4 py-3">{s._count?.occurrences ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        className="text-xs text-brand-700 hover:underline"
                        onClick={() => {
                          setError(null);
                          setMsg(null);
                          setTransferStudentId(s.id);
                        }}
                      >
                        Transferir
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => removeStudent(s.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
              <p className="text-sm text-slate-600">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total} aluno(s)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={listLoading || page <= 1}
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
                  disabled={listLoading || page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <TransferStudentModal
        studentId={transferStudentId}
        classes={classes}
        onClose={() => setTransferStudentId(null)}
        onTransferred={(message) => {
          setMsg(message);
          loadStudents();
          loadClasses();
        }}
        onError={setError}
      />
    </div>
  );
}
