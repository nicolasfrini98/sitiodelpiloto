import type { Metadata } from "next";
import Link from "next/link";
import { InformeRegulaciones } from "@/components/InformeRegulaciones";
import { URL_RAAC_ANAC } from "@/lib/licencias";
import {
  CAMBIOS,
  destinatariosUsados,
  fechaCorta,
  FUENTES_MONITOREADAS,
  NOMBRE_DESTINATARIO,
  NOMBRE_IMPACTO,
  nombreFicha,
  plazosQueVienen,
  problemasDelInforme,
  REVISADO_HASTA,
  ULTIMA_REVISION,
  type Impacto,
} from "@/lib/regulaciones";

export const metadata: Metadata = {
  title: "Regulaciones",
  description:
    "Informe mensual de cambios en la normativa aeronáutica argentina que afectan a pilotos: resoluciones de la ANAC, RAAC y plazos de transición, con enlace al Boletín Oficial.",
};

// Si el JSON tiene errores (ids repetidos, fichas inexistentes, "confirmado" sin enlace oficial),
// el build falla acá y lo muestra: es el control de la corrida mensual.
const PROBLEMAS = problemasDelInforme();
if (PROBLEMAS.length > 0) {
  throw new Error(`src/data/regulaciones.json tiene problemas:\n- ${PROBLEMAS.join("\n- ")}`);
}

const URL_BO = "https://www.boletinoficial.gob.ar/seccion/primera";

export default function Page() {
  const plazos = plazosQueVienen(ULTIMA_REVISION);
  const altos = CAMBIOS.filter((c) => c.impacto === "alto").length;
  const sinConfirmar = CAMBIOS.filter((c) => c.estado === "sin-confirmar").length;
  const desde = CAMBIOS.at(-1)?.fechaPublicacion;

  const nombresFichas = Object.fromEntries(
    [...new Set(CAMBIOS.flatMap((c) => c.fichas ?? []))].map((id) => [id, nombreFicha(id) ?? id]),
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Cambios en la normativa</h1>
        <p className="max-w-3xl text-slate-300">
          Qué cambió en las RAAC y en otras normas de la ANAC que afectan a pilotos de avión, planeador y ultraliviano,
          instructores, alumnos y aeródromos. Cada cambio tiene un resumen en lenguaje claro, a quién afecta y el enlace
          al texto oficial.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Dato titulo="Última revisión" valor={fechaCorta(ULTIMA_REVISION)} detalle={`Normas publicadas hasta el ${fechaCorta(REVISADO_HASTA)}`} />
        <Dato titulo="Próxima revisión" valor="Mensual" detalle="Se revisan el Boletín Oficial y la ANAC una vez por mes" />
        <Dato
          titulo="Cambios relevados"
          valor={String(CAMBIOS.length)}
          detalle={desde ? `Desde el ${fechaCorta(desde)} · ${altos} de impacto alto` : undefined}
        />
        <Dato
          titulo="Plazos por venir"
          valor={String(plazos.length)}
          detalle={sinConfirmar > 0 ? `${sinConfirmar} cambio(s) sin confirmar` : "Todos confirmados en fuente oficial"}
        />
      </section>

      <aside className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        <strong>Resumen orientativo, no reemplaza la norma.</strong> Lo que vale es el texto publicado en el{" "}
        <a href={URL_BO} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline">
          Boletín Oficial
        </a>{" "}
        y las{" "}
        <a href={URL_RAAC_ANAC} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline">
          RAAC en el sitio de la ANAC
        </a>
        . Muchos detalles técnicos están en los anexos de cada resolución. Antes de un trámite, consultá con la ANAC o
        tu CIAC.
      </aside>

      {plazos.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Plazos que vienen</h2>
            <p className="text-sm text-slate-400">Fechas de transición posteriores a la última revisión.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {plazos.map((p) => (
              <li
                key={p.cambio.id + p.fecha + p.descripcion}
                className="rounded-xl border border-white/10 bg-slate-900/60 p-4"
              >
                <p className="font-mono text-lg font-semibold text-amber-300">
                  {p.aproximada ? "≈ " : ""}
                  {fechaCorta(p.fecha)}
                </p>
                <p className="mt-1 text-sm text-slate-200">{p.descripcion}</p>
                <a href={`#${p.cambio.id}`} className="mt-2 inline-block text-xs text-sky-400 hover:underline">
                  {p.cambio.tipo} {p.cambio.numero} →
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Línea de tiempo</h2>
          <p className="text-sm text-slate-400">
            Más recientes primero, por fecha de publicación en el Boletín Oficial. Los requisitos actualizados de cada
            licencia están en{" "}
            <Link href="/licencias" className="text-sky-400 hover:underline">
              Licencias
            </Link>
            .
          </p>
        </div>
        <InformeRegulaciones
          cambios={CAMBIOS}
          destinatarios={destinatariosUsados().map((id) => ({ id, nombre: NOMBRE_DESTINATARIO[id] }))}
          impactos={(Object.keys(NOMBRE_IMPACTO) as Impacto[]).map((id) => ({ id, nombre: NOMBRE_IMPACTO[id] }))}
          nombresFichas={nombresFichas}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Fuentes que se revisan cada mes</h2>
        <ul className="space-y-2 text-sm">
          {FUENTES_MONITOREADAS.map((f) => (
            <li key={f.id} className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-400 hover:underline">
                {f.nombre} ↗
              </a>
              <p className="text-slate-400">{f.que}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Dato({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <p className="text-xs tracking-wide text-slate-400 uppercase">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-400">{detalle}</p>}
    </div>
  );
}
