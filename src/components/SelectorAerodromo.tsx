"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Opcion = { icao: string; nombre: string };

/** Cambia `?icao=` en la URL. Sin JavaScript funciona igual como formulario GET. */
export function SelectorAerodromo({ actual, opciones }: { actual: string; opciones: Opcion[] }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  return (
    <form method="get" action="/meteorologia#pronostico" className="flex flex-wrap items-center gap-2">
      <label htmlFor="icao" className="text-sm text-slate-300">
        Aeródromo
      </label>
      <select
        id="icao"
        name="icao"
        defaultValue={actual}
        onChange={(e) => {
          const icao = e.target.value;
          iniciar(() => router.replace(`/meteorologia?icao=${icao}#pronostico`, { scroll: false }));
        }}
        className="max-w-full rounded-lg border border-trazo bg-slate-900 px-3 py-1.5 text-sm text-white"
      >
        {opciones.map((o) => (
          <option key={o.icao} value={o.icao}>
            {o.icao} · {o.nombre}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white">
          Ver
        </button>
      </noscript>
      {pendiente && <span className="text-xs text-slate-400">Cargando…</span>}
    </form>
  );
}
