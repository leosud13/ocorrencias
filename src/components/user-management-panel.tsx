"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateTimeBR } from "@/lib/date-time";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl: string | null;
  isBlocked: boolean;
  blockedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const ROLE_OPTIONS = [
  { value: "GESTAO", label: "Gestão" },
  { value: "PROFESSOR", label: "Professor" },
  { value: "AGENTE_ESCOLAR", label: "Agente escolar" },
];

const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS.map((role) => [role.value, role.label]));

function formatDate(value: string | null) {
  if (!value) return "-";
  return formatDateTimeBR(new Date(value));
}

export function UserManagementPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "PROFESSOR", password: "", isBlocked: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => users.find((u) => u.id === selectedId) ?? null, [selectedId, users]);

  async function loadUsers() {
    setError(null);
    const res = await fetch("/api/gestao/users");
    if (!res.ok) {
      setError("Não foi possível carregar os usuários.");
      return;
    }
    setUsers(await res.json());
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function edit(user: UserRow) {
    setSelectedId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      isBlocked: user.isBlocked,
    });
    setMsg(null);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;

    setLoading(true);
    setMsg(null);
    setError(null);

    const res = await fetch(`/api/gestao/users/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Não foi possível atualizar o usuário.");
      return;
    }

    setMsg("Usuário atualizado.");
    setSelectedId(null);
    setForm({ name: "", email: "", role: "PROFESSOR", password: "", isBlocked: false });
    await loadUsers();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Gestão de usuários</h1>
        <p className="text-sm text-slate-600">
          Gerencie dados cadastrais, perfil, senha e bloqueio de acesso.
        </p>
      </div>

      {msg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.imageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{ROLE_LABELS[user.role] ?? user.role}</td>
                <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3">
                  {user.isBlocked ? (
                    <span className="text-red-700">Bloqueado desde {formatDate(user.blockedAt)}</span>
                  ) : (
                    <span className="text-emerald-700">Ativo</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => edit(user)} className="text-brand-700 hover:underline">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-medium text-slate-900">Editar usuário</h2>
            <p className="text-sm text-slate-600">Deixe a senha em branco para manter a senha atual.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Nome
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              E-mail
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Perfil
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Nova senha
              <input
                type="password"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isBlocked}
              onChange={(e) => setForm((f) => ({ ...f, isBlocked: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            Bloquear acesso deste usuário
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar alterações"}
            </button>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
