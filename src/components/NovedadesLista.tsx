"use client";

import { useEffect, useMemo, useState } from "react";
import type { CategoriaNovedad, EstadoFuente, Novedad } from "@/lib/novedades";

function useAhora(): number | null {
  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setAhora(Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

function haceCuanto(ms: number, ahora: number): string {
  const min = Math.max(0, Math.round((ahora - ms) / 60_000));
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  const meses = Math.floor(d / 30);
  if (meses < 12) return meses === 1 ? "hace 1 mes" : `hace ${meses} meses`;
  const anios = Math.floor(d / 365);
  return anios <= 1 ? "hace más de 1 año" : `hace ${anios} años`;
}

const COLOR_CATEGORIA: Record<CategoriaNovedad, string> = {
  "Vuelo a vela": "text-emerald-300",
  "Aviación general": "text-sky-300",
  "Oficial (ANAC/EANA)": "text-amber-300",
  Internacional: "text-violet-300",
};

type Filtro = CategoriaNovedad | "Todas";

export function NovedadesLista({
  novedades,
  fuentes,
  categorias,
}: {
  novedades: Novedad[];
  fuentes: EstadoFuente[];
  categorias: CategoriaNovedad[];
}) {
  const [filtro, setFiltro] = useState<Filtro>("Todas");
  const ahora = useAhora();

  const cantidades = useMemo(() => {
    const c = new Map<Filtro, number>([["Todas", novedades.length]]);
    for (const n of novedades) c.set(n.categoria, (c.get(n.categoria) ?? 0) + 1);
    return c;
  }, [novedades]);

  const visibles = filtro === "Todas" ? novedades : novedades.filter((n) => n.categoria === filtro);
  const caidas = fuentes.filter((f) => !f.ok);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
        {(["Todas", ...categorias] as Filtro[]).map((c) => {
          const activo = c === filtro;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setFiltro(c)}
              aria-pressed={activo}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                activo
                  ? "border-sky-400/60 bg-sky-500/20 text-sky-100"
                  : "border-trazo bg-slate-900/60 text-slate-300 hover:border-white/25 hover:text-white"
              }`}
            >
              {c} <span className="text-slate-400">({cantidades.get(c) ?? 0})</span>
            </button>
          );
        })}
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-md border border-trazo bg-slate-900/60 p-5 text-sm text-slate-400">
          No hay novedades en esta categoría por ahora.
        </p>
      ) : (
        <ul className="space-y-3">
          {visibles.map((n) => (
            <li key={n.enlace}>
              <article className="flex gap-4 rounded-md border border-trazo bg-slate-900/60 p-4 transition hover:border-sky-400/40">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="rounded-full border border-trazo bg-slate-800 px-2 py-0.5 font-medium text-slate-200">
                      {n.fuente}
                    </span>
                    <span className={COLOR_CATEGORIA[n.categoria]}>{n.categoria}</span>
                    {n.fecha != null && (
                      <time dateTime={new Date(n.fecha).toISOString()} className="text-slate-400">
                        {n.fechaTexto}
                        {ahora != null && <span className="text-slate-500"> · {haceCuanto(n.fecha, ahora)}</span>}
                      </time>
                    )}
                    {n.idioma === "en" && <span className="text-slate-500">en inglés</span>}
                  </div>
                  <h2 className="text-base font-semibold leading-snug text-white">
                    <a href={n.enlace} target="_blank" rel="noopener noreferrer" className="hover:text-sky-300">
                      {n.titulo}
                    </a>
                  </h2>
                  {n.resumen && <p className="text-sm text-slate-300">{n.resumen}</p>}
                  <a
                    href={n.enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-sky-400 hover:text-sky-300"
                  >
                    Leer en {n.fuente} ↗
                  </a>
                </div>
                {n.imagen && (
                  // eslint-disable-next-line @next/next/no-img-element -- imágenes de terceros sin next/image a propósito
                  <img
                    src={n.imagen}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="hidden h-24 w-36 shrink-0 rounded-lg border border-trazo object-cover sm:block"
                  />
                )}
              </article>
            </li>
          ))}
        </ul>
      )}

      <details className="rounded-md border border-trazo bg-slate-900/60 p-4 text-sm text-slate-400">
        <summary className="cursor-pointer select-none">
          Fuentes ({fuentes.length - caidas.length} de {fuentes.length} respondieron)
          {caidas.length > 0 && (
            <span className="text-amber-400"> · sin respuesta: {caidas.map((f) => f.nombre).join(", ")}</span>
          )}
        </summary>
        <ul className="mt-3 space-y-1">
          {fuentes.map((f) => (
            <li key={f.id} className="flex flex-wrap gap-x-2">
              <span className={f.ok ? "text-emerald-400" : "text-amber-400"}>{f.ok ? "●" : "○"}</span>
              <a href={f.sitio} target="_blank" rel="noopener noreferrer" className="text-slate-200 hover:text-sky-300">
                {f.nombre}
              </a>
              <span>· {f.categoria}</span>
              <span>· {f.ok ? `${f.items} notas` : f.error}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
