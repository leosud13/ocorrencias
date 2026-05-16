"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProfileUser = {
  name: string;
  email: string;
  imageUrl: string | null;
};

export function ProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [preview, setPreview] = useState<string | null>(user.imageUrl);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onPhotoChange(file: File | null) {
    setPhoto(file);
    setRemovePhoto(false);
    if (!file) {
      setPreview(user.imageUrl);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    setLoading(true);

    const form = new FormData();
    form.set("name", name);
    form.set("email", email);
    if (password) form.set("password", password);
    if (photo) form.set("photo", photo);
    if (removePhoto) form.set("removePhoto", "true");

    const res = await fetch("/api/profile", { method: "PATCH", body: form });
    setLoading(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Não foi possível atualizar o perfil.");
      return;
    }

    setPassword("");
    setPhoto(null);
    setRemovePhoto(false);
    setPreview(json.imageUrl ?? null);
    setMsg("Perfil atualizado.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Meu perfil</h1>
        <p className="text-sm text-slate-600">Atualize seus dados, senha e foto opcional.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {preview && !removePhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-500">
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="space-y-2">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
            className="block text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={() => {
              setPhoto(null);
              setPreview(null);
              setRemovePhoto(true);
            }}
            className="text-sm text-red-700 hover:underline"
          >
            Remover foto
          </button>
          <p className="text-xs text-slate-500">JPG, PNG, WEBP ou GIF até 750 KB.</p>
        </div>
      </div>

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
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Nova senha
        <input
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Deixe em branco para manter a senha atual"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
        />
      </label>

      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Salvar perfil"}
      </button>
    </form>
  );
}
