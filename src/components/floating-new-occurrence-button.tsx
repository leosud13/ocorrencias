"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  hiddenPrefixes: string[];
};

export function FloatingNewOccurrenceButton({ href, hiddenPrefixes }: Props) {
  const pathname = usePathname();
  const hidden = hiddenPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (hidden) return null;

  return (
    <Link
      href={href}
      aria-label="Adicionar nova ocorrência"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-3xl font-semibold leading-none text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 md:bottom-6 md:right-6 md:h-auto md:w-auto md:px-5 md:py-3 md:text-sm"
    >
      <span aria-hidden="true">+</span>
      <span className="hidden md:inline">&nbsp;Nova ocorrência</span>
    </Link>
  );
}
