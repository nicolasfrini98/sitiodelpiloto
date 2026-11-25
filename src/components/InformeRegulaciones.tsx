"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Cambio, Destinatario, Impacto } from "@/lib/regulaciones";

type Opcion<T extends string> = { id: T; nombre: string };

const ESTILO_IMPACTO: Record<Impacto, string> = {
  alto: "border-red-500/40 bg-red-500/10 text-red-200",
  medio: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  bajo: "border-slate-500/40 bg-slate-500/10 text-slate-300",
};

const PUNTO_IMPACTO: Record<Impacto, string> = {
  alto: "bg-red-400",
  medio: "bg-amber-400",
  bajo: "bg-slate-400",
};

/** "2026-11-25" → "25/11/2026" (sin Date, para no depender de la zona horaria). */
function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}

/** Línea de tiempo de cambios normativos con filtro por destinatario e impacto. */
export function InformeRegulaciones({
  cambios,
  destinatarios,
  impactos,
  nombresFichas,
}: {
  cambios: Cambio[];
  destinatarios: Opcion<Destinatario>[];
  impactos: Opcion<Impacto>[];
  /** id de ficha de /licencias → nombre visible. */
  nombresFichas: Record<string, string>;
}) {
  const [destinatario, setDestinatario] = useState<Destinatario | "todos-los-cambios">("todos-los-cambios");
  const [impacto, setImpacto] = useState<Impacto | "cualquiera">("cualquiera");

  const nombreDestinatario = useMemo(
    () => Object.fromEntries(destinatarios.map((d) => [d.id, d.nombre])) as Record<Destinatario, string>,
    [destinatarios],
  );

  const visibles = cambios.filter((c) => {
    if (impacto !== "cualquiera" && c.impacto !== impacto) return false;
    if (destinatario === "todos-los-cambios") return true;
    // "Todos los pilotos" alcanza a cualquier destinatario que se elija.
    return c.aQuienAfecta.includes(destinatario) || c.aQuienAfecta.includes("todos");
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-md border border-trazo bg-slate-900/60 p-4">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          A quién afecta
          <select
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value as Destinatario | "todos-los-cambios")}
            className="rounded-md border border-trazo bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="todos-los-cambios">Cualquiera</option>
            {destinatarios
              .filter((d) => d.id !== "todos")
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
          </select>
        </label>
        <fieldset className="flex flex-col gap-1 text-xs text-slate-400">
          <legend className="mb-1">Impacto</legend>
          <div className="flex flex-wrap gap-1">
            {[{ id: "cualquiera" as const, nombre: "Todos" }, ...impactos].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setImpacto(o.id)}
                aria-pressed={impacto === o.id}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  impacto === o.id
                    ? "border-sky-500/60 bg-sky-500/20 text-sky-100"
                    : "border-trazo text-slate-300 hover:bg-white/10"
                }`}
              >
                {o.nombre}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="ml-auto text-xs text-slate-400" aria-live="polite">
          {visibles.length} de {cambios.length} cambios
        </p>
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm text-slate-400">No hay cambios con ese filtro.</p>
      ) : (
        <ol className="relative space-y-4 border-l border-trazo pl-5">
          {visibles.map((c) => (
            <li key={c.id} id={c.id} className="relative scroll-mt-24">
              <span
                aria-hidden
                className={`absolute top-5 -left-[1.6rem] h-2.5 w-2.5 rounded-full ring-4 ring-slate-950 ${PUNTO_IMPACTO[c.impacto]}`}
              />
              <article className="rounded-md border border-trazo bg-slate-900/60 p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <time dateTime={c.fechaPublicacion} className="font-mono text-slate-400">
                    BO {fechaCorta(c.fechaPublicacion)}
                  </time>
                  <span className="text-sky-300">
                    {c.tipo} {c.organismo.startsWith("ANAC") ? "ANAC " : ""}
                    {c.numero}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 ${ESTILO_IMPACTO[c.impacto]}`}>
                    Impacto {c.impacto}
                  </span>
                  {c.estado === "sin-confirmar" && (
                    <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-orange-200">
                      Sin confirmar en fuente oficial
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-semibold text-white">{c.titulo}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {c.organismo} · {c.partes.join(" · ")}
                </p>
                <p className="mt-3 text-sm text-slate-200">{c.resumen}</p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {c.aQuienAfecta.map((d) => (
                    <span key={d} className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                      {nombreDestinatario[d] ?? d}
                    </span>
                  ))}
                </div>

                {c.fechasClave && c.fechasClave.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-slate-300">
                    {c.fechasClave.map((f) => (
                      <li key={f.fecha + f.descripcion}>
                        <span className="font-mono text-amber-300">
                          {f.aproximada ? "≈ " : ""}
                          {fechaCorta(f.fecha)}
                        </span>{" "}
                        — {f.descripcion}
                      </li>
                    ))}
                  </ul>
                )}

                {c.fichas && c.fichas.length > 0 && (
                  <p className="mt-3 text-xs text-slate-400">
                    Fichas actualizadas en /licencias:{" "}
                    {c.fichas.map((id, i) => (
                      <span key={id}>
                        {i > 0 && ", "}
                        <Link href={`/licencias/${id}`} className="text-sky-400 hover:underline">
                          {nombresFichas[id] ?? id}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}

                {c.notas && <p className="mt-3 text-xs text-slate-400 italic">{c.notas}</p>}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <a href={c.enlace} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
                    Texto oficial ↗
                  </a>
                  {c.enlacesExtra?.map((e) => (
                    <a
                      key={e.url}
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400/80 hover:underline"
                    >
                      {e.titulo} ↗
                    </a>
                  ))}
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
