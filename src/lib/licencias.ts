// Requisitos de licencias y habilitaciones de piloto según la RAAC (ANAC).
// Los datos viven en src/data/licencias.json; acá están los tipos y las funciones para leerlos.
// Es contenido normativo estático: no se pide nada a internet en tiempo de ejecución.

import datos from "@/data/licencias.json";

/** Un requisito puntual con su cita a la norma (ej. "RAAC 61.505(a)"). */
export type Requisito = {
  texto: string;
  cita: string;
  /** true si el dato no se pudo confirmar en una fuente oficial. */
  aConfirmar?: boolean;
};

export type CambioReciente = {
  texto: string;
  norma: string;
  /** Fecha de publicación en el Boletín Oficial (AAAA-MM-DD). */
  fecha: string;
  url: string;
};

export type Fuente = {
  id: string;
  titulo: string;
  url: string;
  /** Fecha de la norma o de publicación (AAAA-MM-DD). */
  fecha: string;
  detalle?: string;
};

export type NormaConsultada = {
  parte: string;
  titulo: string;
  edicion: string;
  aprobadaPor: string;
  enmiendas: string[];
};

export type TipoFicha = "autorizacion" | "licencia" | "habilitacion" | "atribucion";

export type Ficha = {
  id: string;
  tipo: TipoFicha;
  nombre: string;
  /** Avión, planeador o general (aplica a varias categorías). */
  categoria: "avion" | "planeador" | "general";
  resumen: string;
  requisitosPrevios: Requisito[];
  edad: Requisito[];
  aptitudPsicofisica: Requisito[];
  conocimientos: Requisito[];
  experiencia: Requisito[];
  pericia: Requisito[];
  atribuciones: Requisito[];
  vigencia: Requisito[];
  cambiosRecientes: CambioReciente[];
  notas?: string[];
  /** Ids de `fuentes` (lista global) usadas en esta ficha. */
  fuentes: string[];
};

export type DatosLicencias = {
  ultimaRevision: string;
  normativaConsultada: NormaConsultada[];
  fuentes: Fuente[];
  fichas: Ficha[];
};

const DATOS = datos as DatosLicencias;

export const ULTIMA_REVISION = DATOS.ultimaRevision;
export const NORMATIVA_CONSULTADA = DATOS.normativaConsultada;
export const FICHAS = DATOS.fichas;

/** Enlace a la página oficial de la ANAC donde se publican las RAAC. */
export const URL_RAAC_ANAC =
  "https://www.argentina.gob.ar/anac/resoluciones-disposiciones-y-otras-normas-aeronauticas/raac";

export function buscarFicha(id: string): Ficha | undefined {
  return FICHAS.find((f) => f.id === id);
}

export function fuentesDeFicha(ficha: Ficha): Fuente[] {
  return ficha.fuentes
    .map((id) => DATOS.fuentes.find((f) => f.id === id))
    .filter((f): f is Fuente => f !== undefined);
}

export const SECCIONES_FICHA = [
  { clave: "requisitosPrevios", titulo: "Requisitos previos" },
  { clave: "edad", titulo: "Edad mínima" },
  { clave: "aptitudPsicofisica", titulo: "Aptitud psicofísica (RAAC 67)" },
  { clave: "conocimientos", titulo: "Conocimientos teóricos y examen" },
  { clave: "experiencia", titulo: "Instrucción y experiencia de vuelo" },
  { clave: "pericia", titulo: "Prueba de pericia" },
  { clave: "atribuciones", titulo: "Atribuciones y limitaciones" },
  { clave: "vigencia", titulo: "Vigencia y experiencia reciente" },
] as const satisfies readonly { clave: keyof Ficha; titulo: string }[];

export const NOMBRE_TIPO: Record<TipoFicha, string> = {
  autorizacion: "Autorización",
  licencia: "Licencia",
  habilitacion: "Habilitación",
  atribucion: "Atribución",
};

/** "2026-11-25" → "25/11/2026" (sin pasar por Date, para no depender de la zona horaria). */
export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}
