import Link from "next/link";

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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
          <span aria-hidden className="text-xl">✈</span>
          <span>Sitio del Piloto</span>
        </Link>
        <nav className="hidden gap-1 md:flex">
          {SECCIONES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
            >
              {s.titulo}
            </Link>
          ))}
        </nav>
        <details className="relative md:hidden">
          <summary className="cursor-pointer list-none rounded-md px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10">
            Menú
          </summary>
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-slate-900 p-2 shadow-xl">
            {SECCIONES.map((s) => (
              <Link key={s.href} href={s.href} className="block rounded px-3 py-2 text-sm text-slate-200 hover:bg-white/10">
                {s.titulo}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
