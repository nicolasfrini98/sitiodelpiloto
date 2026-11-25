import Link from "next/link";
import { Suspense } from "react";
import { AutoRefrescar } from "@/components/AutoRefrescar";
import { CategoriaVuelo } from "@/components/CategoriaVuelo";
import { Hace } from "@/components/Hace";
import { buscarAerodromo, DESTACADOS } from "@/lib/aerodromos";
import { obtenerMetars } from "@/lib/aviationweather";
import { capas, viento, visibilidad } from "@/lib/metar";

const TARJETAS = [
  { href: "/metar", titulo: "METAR / TAF", texto: "Reportes de los aeródromos argentinos, decodificados y al día.", listo: true },
  { href: "/meteorologia", titulo: "Meteorología", texto: "Mapa de METAR, SIGMET, alertas del SMN, satélite y pronóstico para vuelo a vela.", listo: true },
  { href: "/licencias", titulo: "Licencias", texto: "Requisitos ANAC para cada licencia y habilitación, con la cita a la RAAC.", listo: true },
  { href: "/novedades", titulo: "Novedades", texto: "Vuelo a vela, carrera aérea y avisos oficiales.", listo: false },
  { href: "/estudio", titulo: "Estudio", texto: "Banco de preguntas para los teóricos ANAC: práctica y simulacro de examen, con la fuente de cada respuesta.", listo: true },
  { href: "/regulaciones", titulo: "Regulaciones", texto: "Qué cambió en las RAAC y normas ANAC, a quién afecta y los plazos que vienen. Se revisa cada mes.", listo: true },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Sitio del Piloto</h1>
        <p className="max-w-2xl text-lg text-slate-300">
          Información para pilotos de planeador y de avión en Argentina: el tiempo en los aeródromos, novedades y material
          para preparar las licencias de la ANAC.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TARJETAS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group rounded-xl border border-white/10 bg-slate-900/60 p-5 hover:border-sky-500/50 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white group-hover:text-sky-300">{t.titulo}</h2>
              {!t.listo && <span className="text-[10px] tracking-wide text-amber-300 uppercase">Próximamente</span>}
            </div>
            <p className="mt-1 text-sm text-slate-400">{t.texto}</p>
          </Link>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-white">Ahora en los principales aeródromos</h2>
          <Link href="/metar" className="text-sm text-sky-400 hover:underline">
            Ver todos →
          </Link>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-400">Cargando METAR…</p>}>
          <Destacados />
        </Suspense>
      </section>
      <AutoRefrescar />
    </div>
  );
}

async function Destacados() {
  const r = await obtenerMetars(DESTACADOS);
  if (!r.ok) return <p className="text-sm text-red-400">No se pudieron cargar los METAR: {r.error}</p>;
  const porIcao = new Map(r.datos.map((m) => [m.icaoId, m]));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {DESTACADOS.map((icao) => {
        const m = porIcao.get(icao);
        const a = buscarAerodromo(icao);
        return (
          <Link
            key={icao}
            href={`/metar/${icao}`}
            className="rounded-xl border border-white/10 bg-slate-900/60 p-4 hover:border-sky-500/50"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-white">{icao}</span>
              <CategoriaVuelo categoria={m?.fltCat} />
              {m && (
                <span className="ml-auto text-xs">
                  <Hace epoch={m.obsTime} />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{a?.nombre}</p>
            {m ? (
              <p className="mt-2 text-sm text-slate-200">
                {viento(m)} · {visibilidad(m)} · {capas(m)}
                {m.temp != null && ` · ${m.temp}°C`}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Sin reporte reciente</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
