"use client";

// Progreso del banco de preguntas guardado en el navegador (localStorage), por pregunta.
// Se lee con useSyncExternalStore: en el servidor y en la hidratación el progreso está vacío,
// y después se completa con lo guardado, sin errores de hidratación.

import { useSyncExternalStore } from "react";

export type ProgresoPregunta = {
  /** Veces respondida bien. */
  bien: number;
  /** Veces respondida mal. */
  mal: number;
  /** Resultado del último intento. */
  ultima: boolean;
};

export type Progreso = Record<string, ProgresoPregunta>;

const CLAVE = "sitiodelpiloto:estudio:progreso:v1";
const EVENTO = "sitiodelpiloto:estudio:progreso";
const VACIO: Progreso = {};

let crudoCache: string | null = null;
let progresoCache: Progreso = VACIO;

function leerCrudo(): string | null {
  try {
    return window.localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

function leer(): Progreso {
  const crudo = leerCrudo();
  if (crudo === crudoCache) return progresoCache;
  crudoCache = crudo;
  try {
    const datos: unknown = crudo ? JSON.parse(crudo) : {};
    progresoCache = datos && typeof datos === "object" ? (datos as Progreso) : VACIO;
  } catch {
    progresoCache = VACIO;
  }
  return progresoCache;
}

function suscribir(aviso: () => void): () => void {
  window.addEventListener("storage", aviso);
  window.addEventListener(EVENTO, aviso);
  return () => {
    window.removeEventListener("storage", aviso);
    window.removeEventListener(EVENTO, aviso);
  };
}

function escribir(nuevo: Progreso) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(nuevo));
  } catch {
    // Sin almacenamiento disponible (modo privado, cuota llena): el progreso no se guarda.
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function useProgreso(): Progreso {
  return useSyncExternalStore(suscribir, leer, () => VACIO);
}

/** Registra el resultado de una o varias preguntas. */
export function registrarRespuestas(resultados: { id: string; bien: boolean }[]) {
  const actual = { ...leer() };
  for (const { id, bien } of resultados) {
    const previo = actual[id] ?? { bien: 0, mal: 0, ultima: false };
    actual[id] = { bien: previo.bien + (bien ? 1 : 0), mal: previo.mal + (bien ? 0 : 1), ultima: bien };
  }
  escribir(actual);
}

/** Borra el progreso de las preguntas indicadas. */
export function borrarProgreso(ids: string[]) {
  const actual = { ...leer() };
  for (const id of ids) delete actual[id];
  escribir(actual);
}
