import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AutoRefrescar } from "@/components/AutoRefrescar";
import { CategoriaVuelo } from "@/components/CategoriaVuelo";
import { CreditoFoto } from "@/components/CreditoFoto";
import { Hace } from "@/components/Hace";
import { buscarAerodromo, DESTACADOS } from "@/lib/aerodromos";
import { obtenerMetars } from "@/lib/aviationweather";
import { FOTOS, type NombreFoto } from "@/lib/fotos";
import { capas, viento, visibilidad } from "@/lib/metar";
import { obtenerUltimasNovedades } from "@/lib/novedades";

const TARJETAS = [
  { href: "/metar", codigo: "METAR", titulo: "METAR / TAF", texto: "Reportes de los aeródromos argentinos, decodificados y al día.", listo: true },
  { href: "/meteorologia", codigo: "WX", titulo: "Meteorología", texto: "Mapa de METAR, SIGMET, alertas del SMN, satélite y pronóstico para vuelo a vela.", listo: true },
  { href: "/licencias", codigo: "LIC", titulo: "Licencias", texto: "Requisitos ANAC para cada licencia y habilitación, con la cita a la RAAC.", listo: true },
  { href: "/estudio", codigo: "EXAM", titulo: "Estudio", texto: "Banco de preguntas para los teóricos ANAC: práctica y simulacro de examen, con la fuente de cada respuesta.", listo: true },
  { href: "/regulaciones", codigo: "RAAC", titulo: "Regulaciones", texto: "Qué cambió en las RAAC y normas ANAC, a quién afecta y los plazos que vienen. Se revisa cada mes.", listo: true },
  { href: "/novedades", codigo: "NEWS", titulo: "Novedades", texto: "Vuelo a vela, aviación general, avisos de ANAC y EANA y noticias internacionales.", listo: true },
];

const GALERIA: NombreFoto[] = ["aconcagua", "pa18", "torre", "learjet"];

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="relative -mx-4 -mt-8 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-3xl">
        <Image
          src={FOTOS.remolque.src}
          alt={FOTOS.remolque.alt}
          fill
          priority
          placeholder="blur"
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050d1c] via-[#050d1c]/70 to-transparent" />
        <div className="relative flex min-h-[420px] flex-col justify-center gap-5 px-6 py-12 sm:px-10">
          <span className="etiqueta-hud w-fit">Planeador · Avión · Argentina</span>
          <h1 className="max-w-xl text-5xl leading-[0.95] font-bold text-white sm:text-6xl">
            Todo lo que un piloto necesita, en un solo lugar
          </h1>
          <p className="max-w-lg text-lg text-slate-200">
            El tiempo en los aeródromos, la meteorología para volar, los requisitos de cada licencia y el material para
            rendir en la ANAC. Hecho para la comunidad de pilotos argentinos, en cada etapa de su carrera.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/metar"
              className="rounded-lg bg-sky-500 px-5 py-2.5 font-display text-lg font-semibold tracking-wide text-slate-950 uppercase hover:bg-sky-400"
            >
              Ver METAR
            </Link>
            <Link
              href="/estudio"
              className="rounded-lg border border-white/30 bg-black/30 px-5 py-2.5 font-display text-lg font-semibold tracking-wide text-white uppercase hover:border-amber-300 hover:text-amber-300"
            >
              Practicar para el examen
            </Link>
          </div>
        </div>
        <CreditoFoto foto="remolque" className="absolute right-3 bottom-2" />
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white uppercase">Ahora en los principales aeródromos</h2>
          <Link href="/metar" className="shrink-0 text-sm text-sky-400 hover:underline">
            Ver los 93 →
          </Link>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-400">Cargando METAR…</p>}>
          <Destacados />
        </Suspense>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white uppercase">Últimas novedades</h2>
          <Link href="/novedades" className="shrink-0 text-sm text-sky-400 hover:underline">
            Ver todas →
          </Link>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-400">Cargando novedades…</p>}>
          <UltimasNovedades />
        </Suspense>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white uppercase">Secciones</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TARJETAS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 p-5 transition hover:-translate-y-0.5 hover:border-sky-400/60 hover:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded border border-sky-400/40 px-1.5 py-0.5 font-mono text-[11px] tracking-wider text-sky-300">
                  {t.codigo}
                </span>
                {!t.listo && <span className="text-[11px] tracking-wider text-amber-300 uppercase">Próximamente</span>}
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-white uppercase group-hover:text-sky-300">{t.titulo}</h3>
              <p className="mt-1 text-slate-400">{t.texto}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white uppercase">Desde el cielo argentino</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {GALERIA.map((n) => {
            const f = FOTOS[n];
            return (
              <figure key={n} className="group relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src={f.src}
                  alt={f.alt}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 280px, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pt-8 pb-2">
                  <p className="text-sm leading-tight font-medium text-white">{f.lugar}</p>
                  <CreditoFoto foto={n} className="text-left" />
                </div>
              </figure>
            );
          })}
        </div>
      </section>
      <AutoRefrescar />
    </div>
  );
}

async function UltimasNovedades() {
  const r = await obtenerUltimasNovedades(4, { soloEnEspanol: true });
  if (!r.ok || r.datos.length === 0) {
    return <p className="text-sm text-slate-400">No pudimos traer novedades ahora.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {r.datos.map((n) => (
        <li key={n.enlace}>
          <a
            href={n.enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="block h-full rounded-xl border border-white/10 bg-slate-900/60 p-4 hover:border-sky-400/60"
          >
            <p className="text-xs tracking-wider text-amber-300 uppercase">
              {n.fuente}
              {n.fechaTexto && <span className="text-slate-500"> · {n.fechaTexto}</span>}
            </p>
            <p className="mt-1 font-medium text-white">{n.titulo}</p>
          </a>
        </li>
      ))}
    </ul>
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
            className="rounded-xl border border-white/10 bg-slate-900/60 p-4 hover:border-sky-400/60"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-semibold text-amber-300">{icao}</span>
              <CategoriaVuelo categoria={m?.fltCat} />
              {m && (
                <span className="ml-auto text-xs">
                  <Hace epoch={m.obsTime} />
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">{a?.nombre}</p>
            {m ? (
              <p className="mt-2 text-slate-200">
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
