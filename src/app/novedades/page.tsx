import type { Metadata } from "next";
import { Suspense } from "react";
import { NovedadesLista } from "@/components/NovedadesLista";
import { CATEGORIAS_NOVEDADES, FUENTES_NOVEDADES, obtenerNovedades } from "@/lib/novedades";

export const metadata: Metadata = {
  title: "Novedades",
  description:
    "Noticias de aviación para pilotos argentinos de planeador y avión: vuelo a vela, aviación general, avisos de ANAC y EANA y novedades internacionales, con enlace a cada fuente.",
};

export default function Page() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">Novedades</h1>
        <p className="max-w-3xl text-slate-300">
          Noticias de aviación relevantes para pilotos argentinos, juntadas de {FUENTES_NOVEDADES.length} fuentes: vuelo a
          vela, aviación general, avisos oficiales de la ANAC y de EANA, y novedades internacionales. Mostramos el título y
          una bajada corta; tocá cada nota para leerla completa en su fuente.
        </p>
        <p className="text-xs text-slate-500">Se actualiza cada pocas horas. Las notas son de sus autores; el sitio no las edita.</p>
      </header>

      <Suspense fallback={<Cargando />}>
        <Listado />
      </Suspense>
    </div>
  );
}

async function Listado() {
  const { novedades, fuentes } = await obtenerNovedades();
  if (novedades.length === 0) {
    return (
      <p className="rounded-md border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-200">
        No pudimos traer noticias de ninguna fuente en este momento. Probá de nuevo más tarde.
      </p>
    );
  }
  return <NovedadesLista novedades={novedades} fuentes={fuentes} categorias={CATEGORIAS_NOVEDADES} />;
}

function Cargando() {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="Cargando novedades">
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="h-28 animate-pulse rounded-md border border-trazo bg-slate-900/60" />
      ))}
    </ul>
  );
}
