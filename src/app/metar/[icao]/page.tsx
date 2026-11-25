import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AutoRefrescar } from "@/components/AutoRefrescar";
import { CategoriaVuelo } from "@/components/CategoriaVuelo";
import { Hace } from "@/components/Hace";
import { buscarAerodromo, DESTACADOS, nombreProvincia } from "@/lib/aerodromos";
import { obtenerHistorialMetar, obtenerTaf, type Metar } from "@/lib/aviationweather";
import {
  altitudDensidad,
  baseCumulos,
  capas,
  horaLocal,
  horaZulu,
  humedadRelativa,
  numero,
  viento,
  visibilidad,
} from "@/lib/metar";

export function generateStaticParams() {
  return DESTACADOS.map((icao) => ({ icao }));
}

export async function generateMetadata({ params }: PageProps<"/metar/[icao]">): Promise<Metadata> {
  const { icao } = await params;
  const a = buscarAerodromo(icao);
  return { title: `METAR ${icao.toUpperCase()}${a ? ` · ${a.nombre}` : ""}` };
}

export default function Page({ params }: PageProps<"/metar/[icao]">) {
  return (
    <div className="space-y-6">
      <Link href="/metar" className="text-sm text-sky-400 hover:underline">
        ← Todos los aeródromos
      </Link>
      <Suspense fallback={<p className="text-sm text-slate-400">Cargando reporte…</p>}>
        <Ficha params={params} />
      </Suspense>
      <AutoRefrescar />
    </div>
  );
}

async function Ficha({ params }: Pick<PageProps<"/metar/[icao]">, "params">) {
  const icao = (await params).icao.toUpperCase();
  if (!/^[A-Z]{4}$/.test(icao)) notFound();
  const aerodromo = buscarAerodromo(icao);

  const [historial, taf] = await Promise.all([obtenerHistorialMetar(icao), obtenerTaf(icao)]);
  if (!aerodromo && historial.ok && historial.datos.length === 0) notFound();

  const ultimo = historial.ok ? historial.datos[0] : undefined;

  return (
    <>
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-3xl font-bold text-white">{icao}</h1>
          <CategoriaVuelo categoria={ultimo?.fltCat} />
        </div>
        <p className="text-slate-300">
          {aerodromo?.nombre ?? ultimo?.name}
          {aerodromo && ` · ${nombreProvincia(aerodromo.provincia)}`}
          {aerodromo?.iata && ` · IATA ${aerodromo.iata}`}
          {aerodromo && ` · Elevación ${numero(Math.round(aerodromo.elevacionM * 3.28084))} ft (${aerodromo.elevacionM} m)`}
        </p>
      </header>

      {!historial.ok && <p className="text-red-400">No se pudo cargar el METAR: {historial.error}</p>}
      {historial.ok && !ultimo && (
        <p className="rounded-lg border border-white/10 bg-slate-900/60 p-4 text-slate-400">
          No hay METAR en las últimas 12 horas. Muchos aeródromos no operan H24.
        </p>
      )}
      {ultimo && <UltimoMetar m={ultimo} />}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">TAF</h2>
        {!taf.ok && <p className="text-red-400">No se pudo cargar el TAF: {taf.error}</p>}
        {taf.ok && !taf.datos && <p className="text-sm text-slate-400">Este aeródromo no tiene TAF vigente.</p>}
        {taf.ok && taf.datos && (
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-slate-900 p-4 font-mono text-sm whitespace-pre-wrap text-sky-200">
            {taf.datos.rawTAF.replace(/\s(?=(BECMG|TEMPO|FM\d{6}|PROB\d{2}))/g, "\n  ")}
          </pre>
        )}
      </section>

      {historial.ok && historial.datos.length > 1 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Últimas 12 horas</h2>
          <ul className="space-y-1 rounded-lg border border-white/10 bg-slate-900 p-4 font-mono text-xs text-slate-300">
            {historial.datos.map((m) => (
              <li key={`${m.obsTime}-${m.metarType}`} className="break-words">
                {m.rawOb}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Dato({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
      <p className="text-xs text-slate-400">{titulo}</p>
      <p className="text-lg font-semibold text-white">{valor}</p>
      {nota && <p className="text-xs text-slate-500">{nota}</p>}
    </div>
  );
}

function UltimoMetar({ m }: { m: Metar }) {
  const da = altitudDensidad(m);
  const base = baseCumulos(m);
  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-sky-500/30 bg-slate-900 p-4">
        <p className="mb-1 text-xs text-slate-400">
          {m.metarType} de las {horaZulu(m.obsTime)} ({horaLocal(m.obsTime)} hora local) · <Hace epoch={m.obsTime} />
        </p>
        <p className="font-mono text-base break-words text-sky-200">{m.rawOb}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Dato titulo="Viento" valor={viento(m)} />
        <Dato titulo="Visibilidad" valor={visibilidad(m)} />
        <Dato titulo="Nubes" valor={capas(m)} />
        <Dato titulo="Fenómenos" valor={m.wxString || "—"} />
        <Dato
          titulo="Temperatura / Rocío"
          valor={m.temp != null ? `${m.temp}° / ${m.dewp}°C` : "—"}
          nota={m.temp != null && m.dewp != null ? `Humedad ${humedadRelativa(m.temp, m.dewp)} %` : undefined}
        />
        <Dato titulo="QNH" valor={m.altim != null ? `${Math.round(m.altim)} hPa` : "—"} />
        <Dato
          titulo="Altitud de densidad"
          valor={da != null ? `${numero(da)} ft` : "—"}
          nota="Aproximada, a partir de T y QNH"
        />
        <Dato
          titulo="Base estimada de cúmulos"
          valor={base != null ? `${numero(base)} ft AGL` : "—"}
          nota="(T − Td) × 400 ft · orientativo para vuelo a vela"
        />
      </div>
    </section>
  );
}
