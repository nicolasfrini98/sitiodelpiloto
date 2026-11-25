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
import { capas, horaZulu, viento, visibilidad } from "@/lib/metar";
import { obtenerUltimasNovedades } from "@/lib/novedades";

// Cada sección es un cartel de dirección de aeródromo: amarillo, letras negras y la flecha hacia donde ir.
const CARTELES = [
  { href: "/metar", cartel: "METAR / TAF", texto: "El último reporte de los 93 aeródromos que publican METAR, decodificado, con TAF e historial." },
  { href: "/meteorologia", cartel: "Meteorología", texto: "Mapa con SIGMET, alertas del SMN y radar, satélite GOES-19 y pronóstico de térmicas por aeródromo." },
  { href: "/licencias", cartel: "Licencias", texto: "Qué pide la ANAC para cada licencia y habilitación, con la sección de la RAAC al lado de cada requisito." },
  { href: "/estudio", cartel: "Estudio", texto: "Preguntas para los teóricos de planeador, privado, comercial e instructor. Práctica o simulacro con reloj." },
  { href: "/regulaciones", cartel: "Regulaciones", texto: "Qué cambió en la normativa, a quién le toca y qué plazos vencen. Se revisa una vez por mes." },
  { href: "/novedades", cartel: "Novedades", texto: "Vuelo a vela, aviación general y avisos de ANAC y EANA, juntos en un solo listado." },
];

const GALERIA: NombreFoto[] = ["aconcagua", "pa18", "aeroparque", "learjet"];

// Aeródromo cuyo METAR crudo encabeza la portada.
const ICAO_PORTADA = "SABE";

export default function Home() {
  return (
    <div className="space-y-20">
      <section className="relative -mx-4 -mt-8 overflow-hidden border-b border-trazo sm:mx-0 sm:mt-0 sm:rounded-md sm:border">
        {/* En celular la foto va arriba y el texto abajo; en pantallas anchas, el texto sobre la foto, a la izquierda. */}
        <div className="relative h-64 sm:absolute sm:inset-0 sm:h-auto">
          <Image
            src={FOTOS.remolque.src}
            alt={FOTOS.remolque.alt}
            fill
            priority
            placeholder="blur"
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="object-cover object-[64%_45%] sm:object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent to-50% sm:hidden" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-background via-background/75 to-background/0 sm:block" />
          <div className="absolute inset-0 hidden bg-gradient-to-t from-black/70 via-transparent to-transparent sm:block" />
        </div>
        <div className="relative flex flex-col sm:min-h-[600px]">
          <div className="flex flex-1 flex-col justify-center gap-6 px-6 pt-2 pb-10 sm:px-10 sm:pt-14">
            <h1 className="max-w-[11ch] text-[3.4rem] font-bold text-white sm:text-[5.2rem]">
              El briefing de antes de volar
            </h1>
            <p className="max-w-[52ch] text-lg leading-relaxed text-slate-200">
              El tiempo en los aeródromos argentinos, la meteorología para vuelo a vela, los requisitos de cada licencia y
              las preguntas para rendir en la ANAC. Para pilotos de planeador y de avión, de la primera clase a la línea.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/metar"
                className="rounded bg-cielo px-5 py-2.5 font-display text-lg font-semibold text-slate-950 hover:bg-sky-300"
              >
                Ver el tiempo en los aeródromos
              </Link>
              <Link
                href="/estudio"
                className="rounded border border-white/40 bg-black/30 px-5 py-2.5 font-display text-lg font-semibold text-white hover:border-ambar hover:text-ambar"
              >
                Practicar para el teórico
              </Link>
            </div>
          </div>
          <Suspense fallback={<TiraMetarVacia />}>
            <TiraMetar />
          </Suspense>
        </div>
        <CreditoFoto foto="remolque" className="absolute top-2 right-3" />
      </section>

      <section className="space-y-5">
        <EncabezadoSeccion titulo="Ahora en los principales aeródromos" href="/metar" enlace="Ver los 93 aeródromos" />
        <Suspense fallback={<p className="text-sm text-slate-400">Cargando METAR…</p>}>
          <Destacados />
        </Suspense>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Secciones</h2>
        <ul className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {CARTELES.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="group block">
                <span className="cartel-direccion inline-flex items-center gap-3 px-3 py-1.5 text-2xl transition-transform group-hover:translate-x-1">
                  {c.cartel}
                  <FlechaCartel />
                </span>
                <p className="mt-3 max-w-[40ch] text-slate-300 group-hover:text-white">{c.texto}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-5">
        <EncabezadoSeccion titulo="Últimas novedades" href="/novedades" enlace="Ver todas las novedades" />
        <Suspense fallback={<p className="text-sm text-slate-400">Cargando novedades…</p>}>
          <UltimasNovedades />
        </Suspense>
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Desde el cielo argentino</h2>
        <div className="grid gap-3 sm:grid-cols-3 sm:grid-rows-[repeat(3,12.5rem)]">
          {GALERIA.map((n, i) => {
            const f = FOTOS[n];
            const grande = i === 0;
            return (
              <figure
                key={n}
                className={`relative overflow-hidden rounded-md ${
                  grande ? "aspect-[4/3] sm:col-span-2 sm:row-span-3 sm:aspect-auto" : "aspect-[16/10] sm:aspect-auto"
                }`}
              >
                <Image
                  src={f.src}
                  alt={f.alt}
                  fill
                  placeholder="blur"
                  sizes={grande ? "(min-width: 1152px) 760px, (min-width: 640px) 66vw, 100vw" : "(min-width: 1152px) 380px, (min-width: 640px) 33vw, 100vw"}
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pt-14 pb-3">
                  <p className={`font-display leading-tight font-semibold text-white ${grande ? "text-3xl" : "text-xl"}`}>
                    {f.lugar}
                  </p>
                  <CreditoFoto foto={n} className="mt-0.5 text-left" />
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

function EncabezadoSeccion({ titulo, href, enlace }: { titulo: string; href: string; enlace: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <h2 className="text-3xl font-bold text-white sm:text-4xl">{titulo}</h2>
      <Link href={href} className="text-cielo underline-offset-4 hover:underline">
        {enlace}
      </Link>
    </div>
  );
}

/** Flecha de cartel de aeródromo: trazo grueso, negra sobre amarillo. */
function FlechaCartel() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path d="M3 12h15M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" />
    </svg>
  );
}

function TiraMetarVacia() {
  return <div className="h-[92px] border-t border-trazo bg-black/80" />;
}

/** El METAR crudo de Aeroparque, como sale del teletipo, y debajo lo que dice en castellano. */
async function TiraMetar() {
  const r = await obtenerMetars([ICAO_PORTADA]);
  const m = r.ok ? r.datos[0] : undefined;
  const a = buscarAerodromo(ICAO_PORTADA);
  if (!m) return <TiraMetarVacia />;

  return (
    <Link
      href={`/metar/${ICAO_PORTADA}`}
      className="group block border-t border-trazo bg-black/80 px-6 py-4 backdrop-blur-sm sm:px-10"
    >
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
        <span className="text-ambar">{a?.nombre ?? ICAO_PORTADA}</span>
        <span>observado {horaZulu(m.obsTime)}</span>
        <Hace epoch={m.obsTime} />
        <span className="ml-auto text-cielo group-hover:underline">Ver TAF e historial</span>
      </p>
      <p className="codigo-metar imprimir mt-1.5 text-[0.95rem] leading-snug text-ambar sm:text-xl">{m.rawOb}</p>
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <Dato nombre="Viento" valor={viento(m)} />
        <Dato nombre="Visibilidad" valor={visibilidad(m)} />
        <Dato nombre="Nubes" valor={capas(m)} />
        {m.temp != null && <Dato nombre="Temp." valor={`${m.temp} °C`} />}
        {m.altim != null && <Dato nombre="QNH" valor={`${Math.round(m.altim)} hPa`} />}
      </dl>
    </Link>
  );
}

function Dato({ nombre, valor }: { nombre: string; valor: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-slate-400">{nombre}</dt>
      <dd className="text-white">{valor}</dd>
    </div>
  );
}

async function UltimasNovedades() {
  const r = await obtenerUltimasNovedades(4, { soloEnEspanol: true });
  if (!r.ok || r.datos.length === 0) {
    return <p className="text-sm text-slate-400">No pudimos traer novedades ahora. Probá de nuevo en un rato.</p>;
  }
  return (
    <ul className="grid border-t border-trazo sm:grid-cols-2 sm:gap-x-10">
      {r.datos.map((n) => (
        <li key={n.enlace} className="border-b border-trazo">
          <a href={n.enlace} target="_blank" rel="noopener noreferrer" className="group block py-4">
            <p className="flex gap-3 text-sm">
              <span className="font-semibold text-ambar">{n.fuente}</span>
              {n.fechaTexto && <span className="text-slate-500">{n.fechaTexto}</span>}
            </p>
            <p className="mt-1 text-lg leading-snug font-medium text-white group-hover:text-sky-300">{n.titulo}</p>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Tablero de aeródromos: una fila por estación, como una pizarra de despacho. */
async function Destacados() {
  const r = await obtenerMetars(DESTACADOS);
  if (!r.ok) return <p className="text-sm text-red-400">No se pudieron cargar los METAR: {r.error}</p>;
  const porIcao = new Map(r.datos.map((m) => [m.icaoId, m]));

  return (
    <div className="overflow-hidden rounded-md border border-trazo bg-carta/70">
      <div className="hidden grid-cols-[8.5rem_1fr_7.5rem_6rem_1.3fr_4rem_7rem] gap-4 border-b border-trazo px-4 py-2 text-sm text-slate-400 md:grid">
        <span>Aeródromo</span>
        <span />
        <span>Viento</span>
        <span>Visibilidad</span>
        <span>Nubes</span>
        <span>Temp.</span>
        <span className="text-right">Observado</span>
      </div>
      <ul>
        {DESTACADOS.map((icao) => {
          const m = porIcao.get(icao);
          const a = buscarAerodromo(icao);
          return (
            <li key={icao} className="border-b border-trazo last:border-b-0">
              <Link
                href={`/metar/${icao}`}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-white/[0.04] md:grid-cols-[8.5rem_1fr_7.5rem_6rem_1.3fr_4rem_7rem]"
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-lg font-semibold text-ambar">{icao}</span>
                  <CategoriaVuelo categoria={m?.fltCat} />
                </span>
                <span className="truncate text-slate-300">{a?.nombre}</span>
                <span className="text-right text-xs md:order-last">{m && <Hace epoch={m.obsTime} />}</span>
                {m ? (
                  <>
                    <span className="col-span-3 flex flex-wrap gap-x-4 text-white md:col-span-1">
                      {viento(m)}
                      <span className="text-slate-300 md:hidden">{visibilidad(m)}</span>
                      <span className="text-slate-300 md:hidden">{capas(m)}</span>
                      {m.temp != null && <span className="text-slate-300 md:hidden">{m.temp} °C</span>}
                    </span>
                    <span className="hidden text-white md:block">{visibilidad(m)}</span>
                    <span className="hidden truncate text-white md:block">{capas(m)}</span>
                    <span className="hidden text-white md:block">{m.temp != null ? `${m.temp} °C` : "—"}</span>
                  </>
                ) : (
                  <span className="col-span-3 text-sm text-slate-500 md:col-span-4">Sin reporte reciente</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
