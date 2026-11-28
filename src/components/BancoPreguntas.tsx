"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MateriaId, Pregunta } from "@/lib/estudio";
import { borrarProgreso, registrarRespuestas, useProgreso, type Progreso } from "./progresoEstudio";

type MateriaOpcion = { id: MateriaId; nombre: string };

/** Una pregunta con el orden en que se muestran sus opciones (índices de la lista original). */
type Item = { pregunta: Pregunta; orden: number[] };

type Estado =
  | { modo: "inicio"; aviso?: string }
  | { modo: "practica"; items: Item[]; indice: number; elegida: number | null; aciertos: number }
  | { modo: "examen"; items: Item[]; indice: number; respuestas: (number | null)[]; fin: number | null }
  | { modo: "resultado"; items: Item[]; respuestas: (number | null)[]; porTiempo: boolean };

type FiltroRepaso = "todas" | "no-respondidas" | "falladas";

/** De dónde salen las preguntas: el cuestionario oficial de la ANAC, el banco propio del sitio o ambos. */
type FiltroOrigen = "oficiales" | "todas" | "propias";

const LETRAS = ["A", "B", "C", "D"];
const MINUTOS_POR_PREGUNTA = 1.5;

/** Mezcla Fisher–Yates. Solo se llama desde eventos del usuario (nunca durante el render). */
function mezclar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Mezcla las preguntas, pero las del cuestionario oficial de la ANAC siempre van primero. */
function crearItems(preguntas: Pregunta[]): Item[] {
  const ordenadas = [...mezclar(preguntas.filter((p) => p.oficial)), ...mezclar(preguntas.filter((p) => !p.oficial))];
  return ordenadas.map((pregunta) => ({ pregunta, orden: mezclar(pregunta.opciones.map((_, i) => i)) }));
}

function filtrar(
  preguntas: Pregunta[],
  origen: FiltroOrigen,
  materia: MateriaId | "todas",
  repaso: FiltroRepaso,
  progreso: Progreso,
) {
  return preguntas.filter((p) => {
    if (origen === "oficiales" && !p.oficial) return false;
    if (origen === "propias" && p.oficial) return false;
    if (materia !== "todas" && p.materia !== materia) return false;
    if (repaso === "no-respondidas") return !progreso[p.id];
    if (repaso === "falladas") return progreso[p.id]?.ultima === false;
    return true;
  });
}

function reloj(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function BancoPreguntas({
  preguntas,
  materias,
  porcentajeAprobacion,
}: {
  preguntas: Pregunta[];
  materias: MateriaOpcion[];
  porcentajeAprobacion: number;
}) {
  const progreso = useProgreso();
  const [estado, setEstado] = useState<Estado>({ modo: "inicio" });
  const oficiales = preguntas.filter((p) => p.oficial).length;
  // Si la licencia tiene cuestionario oficial de la ANAC, se practica con ese por defecto.
  const [origen, setOrigen] = useState<FiltroOrigen>(oficiales > 0 ? "oficiales" : "todas");
  const [materia, setMateria] = useState<MateriaId | "todas">("todas");
  const [repaso, setRepaso] = useState<FiltroRepaso>("todas");
  const [cantidad, setCantidad] = useState(20);
  const [cronometro, setCronometro] = useState(true);
  const [ahora, setAhora] = useState(0);

  const tituloRef = useRef<HTMLHeadingElement>(null);
  const estadoRef = useRef(estado);
  const primerRender = useRef(true);

  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);

  const disponibles = useMemo(
    () => filtrar(preguntas, origen, materia, repaso, progreso),
    [preguntas, origen, materia, repaso, progreso],
  );
  const respondidas = preguntas.filter((p) => progreso[p.id]).length;
  const bienUltima = preguntas.filter((p) => progreso[p.id]?.ultima).length;
  const cantidadExamen = Math.min(cantidad, disponibles.length);

  // Mover el foco al título de la pregunta cuando cambia (lectores de pantalla y teclado).
  const claveFoco = estado.modo === "practica" || estado.modo === "examen" ? `${estado.modo}-${estado.indice}` : estado.modo;
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    tituloRef.current?.focus();
  }, [claveFoco]);

  const terminarExamen = useCallback((porTiempo: boolean) => {
    const e = estadoRef.current;
    if (e.modo !== "examen") return;
    registrarRespuestas(
      e.items.flatMap((it, i) =>
        e.respuestas[i] == null ? [] : [{ id: it.pregunta.id, bien: e.respuestas[i] === it.pregunta.correcta }],
      ),
    );
    setEstado({ modo: "resultado", items: e.items, respuestas: e.respuestas, porTiempo });
  }, []);

  // Cronómetro del modo examen.
  const fin = estado.modo === "examen" ? estado.fin : null;
  useEffect(() => {
    if (fin == null) return;
    const tick = () => {
      const t = Date.now();
      setAhora(t);
      if (t >= fin) terminarExamen(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fin, terminarExamen]);

  function empezarPractica(lista: Pregunta[]) {
    if (lista.length === 0) return;
    setEstado({ modo: "practica", items: crearItems(lista), indice: 0, elegida: null, aciertos: 0 });
  }

  function empezarExamen() {
    if (cantidadExamen === 0) return;
    const items = crearItems(disponibles).slice(0, cantidadExamen);
    const finExamen = cronometro ? Date.now() + Math.round(items.length * MINUTOS_POR_PREGUNTA * 60_000) : null;
    setEstado({ modo: "examen", items, indice: 0, respuestas: items.map(() => null), fin: finExamen });
  }

  // ───────────── Inicio ─────────────
  if (estado.modo === "inicio") {
    return (
      <div className="space-y-6">
        {estado.aviso && (
          <p role="status" className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">
            {estado.aviso}
          </p>
        )}

        <section className="rounded-md border border-trazo bg-slate-900/60 p-5">
          <h2 ref={tituloRef} tabIndex={-1} className="font-semibold text-white outline-none">
            Tu progreso en este navegador
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Respondiste {respondidas} de {preguntas.length} preguntas; {bienUltima} bien en el último intento.
          </p>
          {respondidas > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("¿Borrar tu progreso de esta licencia? No se puede deshacer.")) {
                  borrarProgreso(preguntas.map((p) => p.id));
                }
              }}
              className="mt-2 text-xs text-slate-400 underline hover:text-slate-200"
            >
              Borrar mi progreso
            </button>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Se guarda solo en este dispositivo (localStorage). No se envía a ningún lado.
          </p>
        </section>

        <section className="space-y-4 rounded-md border border-trazo bg-slate-900/60 p-5">
          <h2 className="font-semibold text-white">Elegí qué preguntas</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {oficiales > 0 && (
              <label className="block text-sm text-slate-300 sm:col-span-2">
                Preguntas
                <select
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value as FiltroOrigen)}
                  className="mt-1 block w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="oficiales">Cuestionario oficial de la ANAC ({oficiales})</option>
                  <option value="todas">Todas: primero las de la ANAC y después las del sitio ({preguntas.length})</option>
                  <option value="propias">Solo las del sitio ({preguntas.length - oficiales})</option>
                </select>
              </label>
            )}
            <label className="block text-sm text-slate-300">
              Materia
              <select
                value={materia}
                onChange={(e) => setMateria(e.target.value as MateriaId | "todas")}
                className="mt-1 block w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-white"
              >
                <option value="todas">Todas las materias</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Repaso
              <select
                value={repaso}
                onChange={(e) => setRepaso(e.target.value as FiltroRepaso)}
                className="mt-1 block w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-white"
              >
                <option value="todas">Todas</option>
                <option value="no-respondidas">Solo las que nunca respondí</option>
                <option value="falladas">Solo las que fallé la última vez</option>
              </select>
            </label>
          </div>
          <p className="text-sm text-slate-400" aria-live="polite">
            {disponibles.length} {disponibles.length === 1 ? "pregunta disponible" : "preguntas disponibles"} con este filtro.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="flex flex-col rounded-md border border-trazo bg-slate-900/60 p-5">
            <h2 className="font-semibold text-white">Modo práctica</h2>
            <p className="mt-1 flex-1 text-sm text-slate-300">
              Una pregunta a la vez. Al responder ves si acertaste, la explicación y la norma o documento de donde sale.
            </p>
            <button
              type="button"
              disabled={disponibles.length === 0}
              onClick={() => empezarPractica(disponibles)}
              className="mt-4 min-h-11 rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Practicar ({disponibles.length})
            </button>
          </section>

          <section className="flex flex-col rounded-md border border-trazo bg-slate-900/60 p-5">
            <h2 className="font-semibold text-white">Modo examen</h2>
            <p className="mt-1 text-sm text-slate-300">
              Preguntas al azar, sin ver las respuestas hasta el final. Para aprobar el teórico real la RAAC 61.085(b) pide{" "}
              {porcentajeAprobacion} %.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <label className="text-sm text-slate-300">
                Cantidad
                <select
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className="mt-1 block rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-white"
                >
                  {[10, 20, 30, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={cronometro}
                  onChange={(e) => setCronometro(e.target.checked)}
                  className="size-4 accent-sky-500"
                />
                Cronómetro ({Math.round(cantidadExamen * MINUTOS_POR_PREGUNTA)} min)
              </label>
            </div>
            {cantidadExamen < cantidad && disponibles.length > 0 && (
              <p className="mt-2 text-xs text-amber-300">Con este filtro hay solo {disponibles.length} preguntas.</p>
            )}
            <button
              type="button"
              disabled={cantidadExamen === 0}
              onClick={empezarExamen}
              className="mt-4 min-h-11 rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Empezar examen ({cantidadExamen})
            </button>
          </section>
        </div>
      </div>
    );
  }

  // ───────────── Práctica ─────────────
  if (estado.modo === "practica") {
    const { items, indice, elegida, aciertos } = estado;
    const { pregunta, orden } = items[indice];
    const respondida = elegida != null;
    const acerto = elegida === pregunta.correcta;
    const ultima = indice === items.length - 1;

    const responder = (original: number) => {
      if (respondida) return;
      const bien = original === pregunta.correcta;
      registrarRespuestas([{ id: pregunta.id, bien }]);
      setEstado({ ...estado, elegida: original, aciertos: aciertos + (bien ? 1 : 0) });
    };
    const terminar = () =>
      setEstado({
        modo: "inicio",
        aviso: `Práctica terminada: ${aciertos} bien de ${indice + (respondida ? 1 : 0)} respondidas.`,
      });

    return (
      <div className="space-y-4">
        <BarraEstado
          izquierda={`Pregunta ${indice + 1} de ${items.length}`}
          derecha={`${aciertos} bien`}
          materia={materias.find((m) => m.id === pregunta.materia)?.nombre}
        />
        <article className="space-y-4 rounded-md border border-trazo bg-slate-900/60 p-5">
          <h2 ref={tituloRef} tabIndex={-1} className="text-lg font-medium text-white outline-none">
            {pregunta.enunciado}
          </h2>
          <ul className="space-y-2">
            {orden.map((original, pos) => {
              const esCorrecta = original === pregunta.correcta;
              const esElegida = original === elegida;
              let estilo = "border-white/15 bg-slate-950 hover:border-sky-500/60";
              if (respondida && esCorrecta) estilo = "border-emerald-500 bg-emerald-500/15";
              else if (respondida && esElegida) estilo = "border-red-500 bg-red-500/15";
              else if (respondida) estilo = "border-trazo bg-slate-950 opacity-70";
              return (
                <li key={original}>
                  <button
                    type="button"
                    onClick={() => responder(original)}
                    disabled={respondida}
                    className={`flex min-h-11 w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-slate-100 disabled:cursor-default ${estilo}`}
                  >
                    <span className="font-mono text-sm text-slate-400">{LETRAS[pos]}</span>
                    <span className="flex-1">
                      {pregunta.opciones[original]}
                      {respondida && esCorrecta && <span className="ml-2 text-xs text-emerald-300">(correcta)</span>}
                      {respondida && esElegida && !esCorrecta && (
                        <span className="ml-2 text-xs text-red-300">(tu respuesta)</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div aria-live="polite">
            {respondida && (
              <div
                className={`space-y-2 rounded-lg border p-4 ${acerto ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"}`}
              >
                <p className={`font-semibold ${acerto ? "text-emerald-200" : "text-red-200"}`}>
                  {acerto ? "¡Correcto!" : "Incorrecto."}
                </p>
                {pregunta.explicacion && <p className="text-sm text-slate-200">{pregunta.explicacion}</p>}
                <Fuente pregunta={pregunta} />
              </div>
            )}
          </div>
        </article>

        <div className="flex flex-wrap gap-3">
          {respondida && !ultima && (
            <button
              type="button"
              onClick={() => setEstado({ ...estado, indice: indice + 1, elegida: null })}
              className="min-h-11 rounded-lg bg-sky-600 px-5 py-2 font-medium text-white hover:bg-sky-500"
            >
              Siguiente
            </button>
          )}
          <button
            type="button"
            onClick={terminar}
            className={
              respondida && ultima
                ? "min-h-11 rounded-lg bg-sky-600 px-5 py-2 font-medium text-white hover:bg-sky-500"
                : "min-h-11 rounded-lg border border-white/15 px-5 py-2 text-slate-200 hover:bg-white/10"
            }
          >
            {respondida && ultima ? "Terminar práctica" : "Salir"}
          </button>
        </div>
      </div>
    );
  }

  // ───────────── Examen ─────────────
  if (estado.modo === "examen") {
    const { items, indice, respuestas } = estado;
    const { pregunta, orden } = items[indice];
    const contestadas = respuestas.filter((r) => r != null).length;
    const restante = estado.fin != null && ahora > 0 ? estado.fin - ahora : null;

    const elegir = (original: number) => {
      const nuevas = [...respuestas];
      nuevas[indice] = original;
      setEstado({ ...estado, respuestas: nuevas });
    };
    const ir = (i: number) => setEstado({ ...estado, indice: i });
    const entregar = () => {
      const faltan = items.length - contestadas;
      if (faltan > 0 && !window.confirm(`Te faltan ${faltan} preguntas. ¿Entregar igual?`)) return;
      terminarExamen(false);
    };

    return (
      <div className="space-y-4">
        <BarraEstado
          izquierda={`Pregunta ${indice + 1} de ${items.length} · ${contestadas} respondidas`}
          derecha={
            restante != null ? (
              <span className={restante < 60_000 ? "font-mono text-amber-300" : "font-mono"} aria-label="Tiempo restante">
                ⏱ {reloj(restante)}
              </span>
            ) : undefined
          }
          materia={materias.find((m) => m.id === pregunta.materia)?.nombre}
        />
        <article className="space-y-4 rounded-md border border-trazo bg-slate-900/60 p-5">
          <h2 ref={tituloRef} tabIndex={-1} className="text-lg font-medium text-white outline-none">
            {pregunta.enunciado}
          </h2>
          <ul className="space-y-2" role="list">
            {orden.map((original, pos) => {
              const elegida = respuestas[indice] === original;
              return (
                <li key={original}>
                  <button
                    type="button"
                    aria-pressed={elegida}
                    onClick={() => elegir(original)}
                    className={`flex min-h-11 w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-slate-100 ${
                      elegida ? "border-sky-400 bg-sky-500/20" : "border-white/15 bg-slate-950 hover:border-sky-500/60"
                    }`}
                  >
                    <span className="font-mono text-sm text-slate-400">{LETRAS[pos]}</span>
                    <span className="flex-1">{pregunta.opciones[original]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </article>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={indice === 0}
            onClick={() => ir(indice - 1)}
            className="min-h-11 rounded-lg border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10 disabled:opacity-40"
          >
            ← Anterior
          </button>
          {indice < items.length - 1 && (
            <button
              type="button"
              onClick={() => ir(indice + 1)}
              className="min-h-11 rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500"
            >
              Siguiente →
            </button>
          )}
          <button
            type="button"
            onClick={entregar}
            className="min-h-11 rounded-lg border border-emerald-500/60 px-4 py-2 font-medium text-emerald-200 hover:bg-emerald-500/10"
          >
            Entregar examen
          </button>
        </div>

        <nav aria-label="Ir a una pregunta" className="flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <button
              key={it.pregunta.id}
              type="button"
              onClick={() => ir(i)}
              aria-current={i === indice ? "step" : undefined}
              aria-label={`Pregunta ${i + 1}${respuestas[i] != null ? ", respondida" : ""}`}
              className={`size-9 rounded-md border text-xs ${
                i === indice
                  ? "border-sky-400 text-white"
                  : respuestas[i] != null
                    ? "border-trazo bg-sky-900/50 text-slate-200"
                    : "border-trazo text-slate-400"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  // ───────────── Resultado ─────────────
  const { items, respuestas, porTiempo } = estado;
  const correctas = items.filter((it, i) => respuestas[i] === it.pregunta.correcta).length;
  const porcentaje = Math.round((correctas / items.length) * 100);
  const aprobado = porcentaje >= porcentajeAprobacion;
  const errores = items.map((it, i) => ({ it, r: respuestas[i] })).filter(({ it, r }) => r !== it.pregunta.correcta);
  const porMateria = materias
    .map((m) => {
      const deLaMateria = items.map((it, i) => ({ it, i })).filter(({ it }) => it.pregunta.materia === m.id);
      return {
        m,
        total: deLaMateria.length,
        bien: deLaMateria.filter(({ it, i }) => respuestas[i] === it.pregunta.correcta).length,
      };
    })
    .filter((x) => x.total > 0);

  return (
    <div className="space-y-6">
      <section
        className={`rounded-md border p-5 ${aprobado ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"}`}
      >
        <h2 ref={tituloRef} tabIndex={-1} className="text-2xl font-bold text-white outline-none">
          {correctas} de {items.length} ({porcentaje} %)
        </h2>
        <p className="mt-1 text-sm text-slate-200">
          {porTiempo && "Se terminó el tiempo. "}
          {aprobado
            ? `Superaste el ${porcentajeAprobacion} % que pide la RAAC 61.085(b) para el teórico.`
            : `No llegaste al ${porcentajeAprobacion} % que pide la RAAC 61.085(b). ¡A repasar!`}
        </p>
        <ul className="mt-3 grid gap-1 text-sm text-slate-300 sm:grid-cols-2">
          {porMateria.map(({ m, total, bien }) => (
            <li key={m.id}>
              {m.nombre}: {bien}/{total}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-400">
          La RAAC también exige el 75 % en cada área; este simulador es orientativo.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setEstado({ modo: "inicio" })}
          className="min-h-11 rounded-lg bg-sky-600 px-5 py-2 font-medium text-white hover:bg-sky-500"
        >
          Volver al inicio
        </button>
        {errores.length > 0 && (
          <button
            type="button"
            onClick={() => empezarPractica(errores.map(({ it }) => it.pregunta))}
            className="min-h-11 rounded-lg border border-white/15 px-5 py-2 text-slate-200 hover:bg-white/10"
          >
            Practicar las {errores.length} que fallé
          </button>
        )}
      </div>

      {errores.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Revisión de errores</h3>
          <ol className="space-y-3">
            {errores.map(({ it, r }) => (
              <li key={it.pregunta.id} className="space-y-2 rounded-md border border-trazo bg-slate-900/60 p-4">
                <p className="font-medium text-white">{it.pregunta.enunciado}</p>
                <p className="text-sm text-red-300">
                  Tu respuesta: {r == null ? "sin responder" : it.pregunta.opciones[r]}
                </p>
                <p className="text-sm text-emerald-300">Correcta: {it.pregunta.opciones[it.pregunta.correcta]}</p>
                {it.pregunta.explicacion && <p className="text-sm text-slate-300">{it.pregunta.explicacion}</p>}
                <Fuente pregunta={it.pregunta} />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function BarraEstado({
  izquierda,
  derecha,
  materia,
}: {
  izquierda: string;
  derecha?: React.ReactNode;
  materia?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-300">
      <span>
        {izquierda}
        {materia && <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-xs text-slate-300">{materia}</span>}
      </span>
      {derecha && <span>{derecha}</span>}
    </div>
  );
}

function Fuente({ pregunta }: { pregunta: Pregunta }) {
  return (
    <div className="space-y-1 text-xs text-slate-400">
      <p>
        Fuente:{" "}
        <a href={pregunta.fuente.url} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">
          {pregunta.fuente.documento}
        </a>
        {" — "}
        {pregunta.fuente.seccion}.
      </p>
      {pregunta.verificada ? (
        <p className="text-emerald-300/80">
          {pregunta.oficial
            ? "✓ Pregunta y respuesta tal como las publicó la ANAC."
            : "✓ Respuesta contrastada con la fuente citada."}
        </p>
      ) : (
        <p className="text-amber-300">⚠ Sin verificar contra la norma vigente. {pregunta.nota}</p>
      )}
    </div>
  );
}
