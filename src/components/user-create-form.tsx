"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLE_OPTIONS = [
  { value: "GESTAO", label: "Gestão" },
  { value: "PROFESSOR", label: "Professor" },
  { value: "AGENTE_ESCOLAR", label: "Agente escolar" },
];

export function UserCreateForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PROFESSOR");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    setLoading(true);

    const res = await fetch("/api/gestao/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    setLoading(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Não foi possível cadastrar o usuário.");
      return;
    }

    setMsg("Usuário cadastrado com sucesso.");
    setName("");
    setEmail("");
    setPassword("");
    setRole("PROFESSOR");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {!compact && (
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cadastrar usuário</h1>
          <p className="text-sm text-slate-600">
            Escolha o perfil de acesso: gestão, professor ou agente escolar.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Nome
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Senha inicial
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Perfil
          <select
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Cadastrar usuário"}
      </button>
    </form>
  );
}
