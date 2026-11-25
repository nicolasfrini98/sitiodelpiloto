"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Aerodromo } from "@/lib/aerodromos";
import { PROVINCIAS } from "@/lib/aerodromos";
import type { Metar } from "@/lib/aviationweather";
import { capas, horaZulu, viento, visibilidad, type Categoria } from "@/lib/metar";
import { CategoriaVuelo } from "./CategoriaVuelo";
import { Hace } from "./Hace";

export type FilaMetar = { aerodromo: Aerodromo; metar: Metar | null };

const FILTROS_CATEGORIA: (Categoria | "todas" | "sin-dato")[] = ["todas", "VFR", "MVFR", "IFR", "LIFR", "sin-dato"];

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function TablaMetar({ filas }: { filas: FilaMetar[] }) {
  const [texto, setTexto] = useState("");
  const [provincia, setProvincia] = useState("");
  const [categoria, setCategoria] = useState<(typeof FILTROS_CATEGORIA)[number]>("todas");

  const visibles = useMemo(() => {
    const q = normalizar(texto.trim());
    return filas.filter(({ aerodromo: a, metar: m }) => {
      if (provincia && a.provincia !== provincia) return false;
      if (categoria === "sin-dato" && m?.fltCat) return false;
      if (categoria !== "todas" && categoria !== "sin-dato" && m?.fltCat !== categoria) return false;
      if (!q) return true;
      return normalizar(`${a.icao} ${a.iata ?? ""} ${a.nombre} ${PROVINCIAS[a.provincia ?? ""] ?? ""}`).includes(q);
    });
  }, [filas, texto, provincia, categoria]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por OACI, IATA, ciudad o provincia (ej: SACO, Córdoba)"
          className="flex-1 rounded-lg border border-trazo bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
        />
        <select
          value={provincia}
          onChange={(e) => setProvincia(e.target.value)}
          className="rounded-lg border border-trazo bg-slate-900 px-3 py-2 text-sm text-white"
          aria-label="Provincia"
        >
          <option value="">Todas las provincias</option>
          {Object.entries(PROVINCIAS)
            .sort((a, b) => a[1].localeCompare(b[1]))
            .map(([cod, nombre]) => (
              <option key={cod} value={cod}>
                {nombre}
              </option>
            ))}
        </select>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as typeof categoria)}
          className="rounded-lg border border-trazo bg-slate-900 px-3 py-2 text-sm text-white"
          aria-label="Categoría de vuelo"
        >
          {FILTROS_CATEGORIA.map((c) => (
            <option key={c} value={c}>
              {c === "todas" ? "Todas las categorías" : c === "sin-dato" ? "Sin reporte reciente" : c}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-400">
        Mostrando {visibles.length} de {filas.length} aeródromos.
      </p>

      <ul className="divide-y divide-white/5 overflow-hidden rounded-md border border-trazo bg-slate-900/60">
        {visibles.map(({ aerodromo: a, metar: m }) => (
          <li key={a.icao}>
            <Link href={`/metar/${a.icao}`} className="block px-4 py-3 hover:bg-white/5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-base font-semibold text-white">{a.icao}</span>
                <CategoriaVuelo categoria={m?.fltCat} />
                <span className="text-sm text-slate-300">{a.nombre}</span>
                <span className="text-xs text-slate-500">{PROVINCIAS[a.provincia ?? ""] ?? ""}</span>
                {m && (
                  <span className="ml-auto text-xs">
                    {horaZulu(m.obsTime)} · <Hace epoch={m.obsTime} />
                  </span>
                )}
              </div>
              {m ? (
                <>
                  <p className="mt-1 font-mono text-xs break-words text-sky-200">{m.rawOb}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Viento {viento(m)} · Vis {visibilidad(m)} · {capas(m)}
                    {m.temp != null && ` · ${m.temp}°/${m.dewp}°`}
                    {m.altim != null && ` · Q${Math.round(m.altim)}`}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs text-slate-500">Sin METAR en las últimas 3 horas (puede no operar H24).</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
