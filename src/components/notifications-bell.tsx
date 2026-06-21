"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { formatDateTimeBR } from "@/lib/date-time";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  occurrence: { id: string; controlNumber: string };
};

function occurrenceHref(role: UserRole | undefined, occurrenceId: string): string {
  if (role === UserRole.GESTAO) return `/gestao/ocorrencias/${occurrenceId}`;
  return `/professor/ocorrencias/${occurrenceId}`;
}

export function NotificationsBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/notifications");
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items ?? []);
    setUnreadCount(data.unreadCount ?? 0);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item,
      ),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setItems((prev) => prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
  }

  const role = session?.user?.role as UserRole | undefined;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) load();
        }}
        className="relative rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
        aria-label="Notificações"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M15 17H9l-1 2h8l-1-2z" />
          <path d="M12 3a5 5 0 00-5 5v3.5l-1.5 2.5h13L17 11.5V8a5 5 0 00-5-5z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Notificações</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-brand-700 hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-500">Carregando…</li>
            )}
            {!loading && items.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-500">
                Nenhuma notificação.
              </li>
            )}
            {items.map((item) => (
              <li key={item.id} className="border-b border-slate-50 last:border-b-0">
                <Link
                  href={occurrenceHref(role, item.occurrence.id)}
                  onClick={() => {
                    if (!item.readAt) markRead(item.id);
                    setOpen(false);
                  }}
                  className={`block px-4 py-3 hover:bg-slate-50 ${item.readAt ? "opacity-75" : "bg-brand-50/40"}`}
                >
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {formatDateTimeBR(new Date(item.createdAt))}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
