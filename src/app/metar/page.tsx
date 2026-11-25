import type { Metadata } from "next";
import { Suspense } from "react";
import { AutoRefrescar } from "@/components/AutoRefrescar";
import { TablaMetar, type FilaMetar } from "@/components/TablaMetar";
import { aerodromos } from "@/lib/aerodromos";
import { obtenerMetars } from "@/lib/aviationweather";
import { CATEGORIAS } from "@/lib/metar";

export const metadata: Metadata = {
  title: "METAR y TAF de Argentina",
  description: "Último METAR de cada aeródromo argentino con categoría de vuelo, decodificado.",
};

export default function Page() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">METAR / TAF de Argentina</h1>
        <p className="max-w-3xl text-slate-300">
          Último reporte de cada aeródromo argentino que publica METAR. Tocá un aeródromo para ver el TAF, el historial de
          las últimas horas y datos útiles como altitud de densidad y base estimada de cúmulos. Se actualiza solo cada 5
          minutos.
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          {Object.entries(CATEGORIAS).map(([cat, info]) => (
            <span key={cat} className="flex items-center gap-1.5">
              <span className={`rounded px-1.5 py-0.5 font-semibold ${info.clase}`}>{cat}</span>
              {info.desc}
            </span>
          ))}
        </div>
      </header>
      <Suspense fallback={<p className="text-sm text-slate-400">Cargando METAR de todo el país…</p>}>
        <ListaMetar />
      </Suspense>
      <AutoRefrescar />
    </div>
  );
}

async function ListaMetar() {
  const r = await obtenerMetars(aerodromos.map((a) => a.icao));
  if (!r.ok) {
    return <p className="text-red-400">No se pudieron cargar los METAR ({r.error}). Probá de nuevo en unos minutos.</p>;
  }
  const porIcao = new Map(r.datos.map((m) => [m.icaoId, m]));
  const filas: FilaMetar[] = aerodromos
    .map((a) => ({ aerodromo: a, metar: porIcao.get(a.icao) ?? null }))
    // Primero los que tienen reporte, después alfabético.
    .sort((x, y) => Number(!x.metar) - Number(!y.metar) || x.aerodromo.icao.localeCompare(y.aerodromo.icao));
  return <TablaMetar filas={filas} />;
}
