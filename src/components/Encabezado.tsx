import Link from "next/link";
import { Logo } from "./Logo";

export const SECCIONES = [
  { href: "/novedades", titulo: "Novedades" },
  { href: "/metar", titulo: "METAR / TAF" },
  { href: "/meteorologia", titulo: "Meteorología" },
  { href: "/licencias", titulo: "Licencias" },
  { href: "/estudio", titulo: "Estudio" },
  { href: "/regulaciones", titulo: "Regulaciones" },
];

export function Encabezado() {
  return (
    <header className="sticky top-0 z-[1100] border-b border-white/10 bg-[#050d1c]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5 text-white">
          <Logo className="h-8 w-8 text-sky-400" />
          <span className="leading-none">
            <span className="block font-display text-xl font-bold tracking-wide uppercase">Sitio del Piloto</span>
            <span className="block text-[11px] tracking-[0.2em] text-slate-400 uppercase">Aviación civil argentina</span>
          </span>
        </Link>
        <nav className="hidden gap-0.5 lg:flex">
          {SECCIONES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-md px-3 py-1.5 font-display text-[0.95rem] font-semibold tracking-wider text-slate-300 uppercase hover:bg-white/10 hover:text-amber-300"
            >
              {s.titulo}
            </Link>
          ))}
        </nav>
        <details className="relative lg:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-white/15 px-3 py-1.5 font-display text-sm font-semibold tracking-wider text-slate-200 uppercase hover:bg-white/10">
            Menú
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-white/10 bg-slate-900 p-2 shadow-xl">
            {SECCIONES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="block rounded px-3 py-2.5 font-display font-semibold tracking-wider text-slate-200 uppercase hover:bg-white/10 hover:text-amber-300"
              >
                {s.titulo}
              </Link>
            ))}
          </div>
        </details>
      </div>
      <div className="franjas-pista" />
    </header>
  );
}
