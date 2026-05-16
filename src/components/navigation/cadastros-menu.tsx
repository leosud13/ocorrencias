"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const items = [
  { href: "/gestao/turmas", label: "Turmas" },
  { href: "/gestao/alunos", label: "Alunos" },
  { href: "/gestao/usuarios", label: "Usuários" },
];

export function CadastrosMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="text-brand-700 hover:underline"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Cadastros
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-20 min-w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          {items.map((item) => (
            <Link
              key={item.href}
              className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
