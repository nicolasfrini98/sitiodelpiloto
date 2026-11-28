import type { Metadata } from "next";
import Link from "next/link";
import {
  conteoPorMateria,
  FUENTES_ESTUDIO,
  LICENCIAS_ESTUDIO,
  PORCENTAJE_APROBACION,
  PREGUNTAS,
  preguntasDeLicencia,
  ULTIMA_REVISION_ESTUDIO,
} from "@/lib/estudio";
import { AvisoEstudio } from "@/components/AvisoEstudio";
import { fechaCorta } from "@/lib/licencias";

export const metadata: Metadata = {
  title: "Estudio",
  description: "Banco de preguntas para preparar los exámenes teóricos de la ANAC, con la fuente de cada respuesta.",
};

export default function Page() {
  const sinVerificar = PREGUNTAS.filter((p) => !p.verificada).length;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">Estudio para los teóricos de la ANAC</h1>
        <p className="max-w-3xl text-slate-300">
          Banco de preguntas por licencia, con modo práctica (explicación y fuente al responder) y modo examen
          (preguntas al azar, cronómetro y revisión de errores). Cada respuesta cita la RAAC o el documento de la ANAC de
          donde sale.
        </p>
      </header>

      <AvisoEstudio />

      <section className="grid gap-4 md:grid-cols-2">
        {LICENCIAS_ESTUDIO.map((l) => {
          const preguntas = preguntasDeLicencia(l.id);
          const conteo = conteoPorMateria(preguntas);
          return (
            <Link
              key={l.id}
              href={`/estudio/${l.id}`}
              className="group flex flex-col rounded-md border border-trazo bg-slate-900/60 p-5 hover:border-sky-500/50 hover:bg-slate-900"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold text-white group-hover:text-sky-300">{l.nombre}</h2>
                <span className="shrink-0 text-sm text-sky-300">{preguntas.length} preguntas</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{l.resumen}</p>
              {preguntas.some((p) => p.oficial) && (
                <p className="mt-2 text-sm text-ambar">
                  Incluye {preguntas.filter((p) => p.oficial).length} preguntas del cuestionario oficial de la ANAC, que
                  salen primero.
                </p>
              )}
              <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-slate-300 sm:grid-cols-2">
                {conteo.map(({ materia, cantidad }) => (
                  <li key={materia.id} className="flex justify-between gap-2 border-b border-white/5 py-0.5">
                    <span>{materia.nombre}</span>
                    <span className="font-mono text-slate-400">{cantidad}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-4 text-sm text-sky-400">Practicar →</span>
            </Link>
          );
        })}
      </section>

      <section className="space-y-3 rounded-md border border-trazo bg-slate-900/60 p-5 text-sm text-slate-300">
        <h2 className="text-lg font-semibold text-white">Cómo se armó el banco</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Las materias siguen lo que la RAAC 61 exige para cada examen (61.510 piloto privado, 61.610 comercial, 61.910
            planeador, 61.1110 y 61.940 instructor). El examen se aprueba con {PORCENTAJE_APROBACION} % en el total y en
            cada área (61.085(b)).
          </li>
          <li>
            <strong className="text-white">Cuestionario oficial (piloto privado de avión):</strong> las preguntas de la
            lista que publicó la ANAC en septiembre de 2014 para el programa de la RAAC 61.105, copiadas tal cual con la
            respuesta que marca la ANAC. Las que usan una figura la muestran, tomada del anexo de figuras de la ANAC.
            Quedaron afuera las que usan imágenes que no están en ese anexo y las que salieron sin respuesta marcada. Las de reglamentación llevan un aviso, porque la RAAC 61 cambió en 2026.
          </li>
          <li>
            <strong className="text-white">Reglamentación:</strong> preguntas redactadas a partir del texto vigente de la
            RAAC 61 (Edición VI, Res. ANAC 65/2026, con la enmienda de la Res. 292/2026) y de la RAAC 67 (Edición V, Res.
            35/2026), con la sección exacta. Incluye los cambios recientes: fin del Comercial de Primera, instrucción
            nocturna integrada al piloto privado, repaso de vuelo de la 61.135 y validez del certificado médico.
          </li>
          <li>
            <strong className="text-white">Materias técnicas:</strong> la ANAC publicó cuestionarios con respuestas
            (piloto privado avión, piloto de planeador, instructor de planeador, control bienal de instructor de avión).
            Usamos esos temas y sus claves de respuesta, pero redactamos las preguntas con nuestras palabras y descartamos
            las que estaban desactualizadas (por ejemplo, las del «VFR controlado», que ya no existe) o tenían la clave
            dudosa.
          </li>
          <li>
            Cada pregunta indica si su respuesta se <strong className="text-white">verificó</strong> contra la fuente.
            Hoy hay {sinVerificar} sin verificar: son reglas del aire tomadas de un texto de la RAAC 91 de 2017, porque no
            pudimos confirmar el texto consolidado vigente.
          </li>
          <li>
            Las opciones se mezclan en cada intento y tu progreso queda guardado solo en tu navegador.
          </li>
        </ul>
        <details className="pt-1">
          <summary className="cursor-pointer text-sky-300">Fuentes usadas ({FUENTES_ESTUDIO.length})</summary>
          <ul className="mt-2 space-y-1">
            {FUENTES_ESTUDIO.map((f) => (
              <li key={f.id}>
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">
                  {f.documento}
                </a>
                <span className="text-slate-500"> — {f.uso}</span>
              </li>
            ))}
          </ul>
        </details>
        <p className="text-xs text-slate-500">Última revisión: {fechaCorta(ULTIMA_REVISION_ESTUDIO)}.</p>
      </section>
    </div>
  );
}
