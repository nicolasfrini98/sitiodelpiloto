// Banco de preguntas para preparar los exámenes teóricos de la ANAC.
// Los datos viven en src/data/estudio/ (un JSON por materia más indice.json con licencias, materias y fuentes).
// Es contenido estático: no se pide nada a internet en tiempo de ejecución.

import indice from "@/data/estudio/indice.json";
import aeronave from "@/data/estudio/aeronave.json";
import factoresHumanos from "@/data/estudio/factores-humanos.json";
import instruccion from "@/data/estudio/instruccion.json";
import meteorologia from "@/data/estudio/meteorologia.json";
import navegacion from "@/data/estudio/navegacion.json";
import principiosDeVuelo from "@/data/estudio/principios-de-vuelo.json";
import procedimientos from "@/data/estudio/procedimientos.json";
import reglamentacion from "@/data/estudio/reglamentacion.json";

export type LicenciaId = "piloto-planeador" | "piloto-privado-avion" | "piloto-comercial-avion" | "instructor-vuelo";

export type MateriaId =
  | "reglamentacion"
  | "meteorologia"
  | "navegacion"
  | "principios-de-vuelo"
  | "aeronave"
  | "factores-humanos"
  | "procedimientos"
  | "instruccion";

export type LicenciaEstudio = {
  id: LicenciaId;
  nombre: string;
  resumen: string;
  /** Ids de las fichas de /licencias relacionadas. */
  fichas: string[];
  /** Materias que exige la RAAC para el examen teórico (texto resumido). */
  materiasAnac: string;
  citaMaterias: string;
};

export type Materia = { id: MateriaId; nombre: string };

export type FuenteEstudio = {
  id: string;
  documento: string;
  url: string;
  /** Condición de uso o tipo de documento. */
  uso: string;
};

/** Pregunta tal como está en los JSON (sin la materia, que sale del archivo). */
type PreguntaCruda = {
  id: string;
  licencias: string[];
  enunciado: string;
  opciones: string[];
  /** Índice (desde 0) de la opción correcta. */
  correcta: number;
  explicacion: string;
  fuente: { id: string; seccion: string };
  /** true si la respuesta se contrastó con el texto de la fuente citada. */
  verificada: boolean;
  /** Motivo por el que quedó sin verificar, u otra aclaración. */
  nota?: string;
};

/** Pregunta lista para mostrar: serializable, con la fuente resuelta. */
export type Pregunta = Omit<PreguntaCruda, "licencias" | "fuente"> & {
  licencias: LicenciaId[];
  materia: MateriaId;
  fuente: { documento: string; seccion: string; url: string };
};

const ARCHIVOS: Record<MateriaId, PreguntaCruda[]> = {
  reglamentacion,
  meteorologia,
  navegacion,
  "principios-de-vuelo": principiosDeVuelo,
  aeronave,
  "factores-humanos": factoresHumanos,
  procedimientos,
  instruccion,
};

export const ULTIMA_REVISION_ESTUDIO: string = indice.ultimaRevision;
export const LICENCIAS_ESTUDIO = indice.licencias as LicenciaEstudio[];
export const MATERIAS = indice.materias as Materia[];
export const FUENTES_ESTUDIO = indice.fuentes as FuenteEstudio[];

/** Página de la ANAC con la normativa vigente (RAAC). */
export const URL_ANAC_RAAC =
  "https://www.argentina.gob.ar/anac/resoluciones-disposiciones-y-otras-normas-aeronauticas/raac";

/** Porcentaje mínimo de aprobación de los exámenes teóricos (RAAC 61.085(b)). */
export const PORCENTAJE_APROBACION = 75;

function resolver(materia: MateriaId, p: PreguntaCruda): Pregunta {
  const fuente = FUENTES_ESTUDIO.find((f) => f.id === p.fuente.id);
  return {
    ...p,
    licencias: p.licencias as LicenciaId[],
    materia,
    fuente: {
      documento: fuente?.documento ?? p.fuente.id,
      seccion: p.fuente.seccion,
      url: fuente?.url ?? URL_ANAC_RAAC,
    },
  };
}

/** Todas las preguntas del banco, en el orden de MATERIAS. */
export const PREGUNTAS: Pregunta[] = MATERIAS.flatMap((m) => ARCHIVOS[m.id].map((p) => resolver(m.id, p)));

export function buscarLicenciaEstudio(id: string): LicenciaEstudio | undefined {
  return LICENCIAS_ESTUDIO.find((l) => l.id === id);
}

export function preguntasDeLicencia(id: LicenciaId): Pregunta[] {
  return PREGUNTAS.filter((p) => p.licencias.includes(id));
}

export function nombreMateria(id: MateriaId): string {
  return MATERIAS.find((m) => m.id === id)?.nombre ?? id;
}

/** Cantidad de preguntas por materia (solo materias con al menos una). */
export function conteoPorMateria(preguntas: Pregunta[]): { materia: Materia; cantidad: number; verificadas: number }[] {
  return MATERIAS.map((materia) => {
    const deLaMateria = preguntas.filter((p) => p.materia === materia.id);
    return { materia, cantidad: deLaMateria.length, verificadas: deLaMateria.filter((p) => p.verificada).length };
  }).filter((c) => c.cantidad > 0);
}

/** Fuentes citadas por un grupo de preguntas, sin repetir. */
export function fuentesCitadas(preguntas: Pregunta[]): FuenteEstudio[] {
  const urls = new Set(preguntas.map((p) => p.fuente.url));
  return FUENTES_ESTUDIO.filter((f) => urls.has(f.url));
}

/**
 * Controles de consistencia del banco (ids repetidos, índice correcto fuera de rango, fuente inexistente,
 * licencia desconocida). Devuelve la lista de problemas; vacía si está todo bien.
 */
export function problemasDelBanco(): string[] {
  const problemas: string[] = [];
  const vistos = new Set<string>();
  const licencias = new Set<string>(LICENCIAS_ESTUDIO.map((l) => l.id));
  for (const m of MATERIAS) {
    for (const p of ARCHIVOS[m.id]) {
      if (vistos.has(p.id)) problemas.push(`${p.id}: id repetido`);
      vistos.add(p.id);
      if (p.opciones.length < 3 || p.opciones.length > 4) problemas.push(`${p.id}: debe tener 3 o 4 opciones`);
      if (!Number.isInteger(p.correcta) || p.correcta < 0 || p.correcta >= p.opciones.length)
        problemas.push(`${p.id}: índice correcto fuera de rango`);
      if (new Set(p.opciones).size !== p.opciones.length) problemas.push(`${p.id}: opciones repetidas`);
      if (!FUENTES_ESTUDIO.some((f) => f.id === p.fuente.id)) problemas.push(`${p.id}: fuente ${p.fuente.id} inexistente`);
      if (p.licencias.length === 0) problemas.push(`${p.id}: sin licencias`);
      for (const l of p.licencias) if (!licencias.has(l)) problemas.push(`${p.id}: licencia ${l} desconocida`);
      if (!p.verificada && !p.nota) problemas.push(`${p.id}: sin verificar y sin nota`);
    }
  }
  return problemas;
}
