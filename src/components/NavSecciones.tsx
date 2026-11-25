"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Seccion = { href: string; titulo: string };

/** Navegación principal: en escritorio una fila; en celular, un menú desplegable. Marca la sección actual. */
export function NavSecciones({ secciones }: { secciones: Seccion[] }) {
  const ruta = usePathname();
  const activa = (href: string) => ruta === href || ruta.startsWith(href + "/");

  return (
    <>
      <nav aria-label="Secciones" className="ml-4 hidden items-stretch self-stretch lg:flex">
        {secciones.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            aria-current={activa(s.href) ? "page" : undefined}
            className={`-mb-[11px] flex items-center border-b-2 px-3 font-display text-[1.05rem] font-semibold transition-colors ${
              activa(s.href)
                ? "border-ambar text-ambar"
                : "border-transparent text-slate-300 hover:border-slate-500 hover:text-white"
            }`}
          >
            {s.titulo}
          </Link>
        ))}
      </nav>
      <details className="group relative order-last lg:hidden">
        <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded border border-slate-700 text-slate-200 hover:bg-white/5">
          <span className="sr-only">Abrir menú</span>
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </summary>
        <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded border border-slate-700 bg-carta shadow-2xl">
          {secciones.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              aria-current={activa(s.href) ? "page" : undefined}
              className={`block border-l-2 px-4 py-3 font-display text-lg font-semibold ${
                activa(s.href)
                  ? "border-ambar bg-white/5 text-ambar"
                  : "border-transparent text-slate-200 hover:bg-white/5"
              }`}
            >
              {s.titulo}
            </Link>
          ))}
        </div>
      </details>
    </>
  );
}
