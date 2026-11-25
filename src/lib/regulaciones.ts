// Informe de cambios normativos que afectan a los pilotos (ANAC, Boletín Oficial, EANA).
// Los datos viven en src/data/regulaciones.json y se actualizan una vez por mes
// (ver docs/revision-mensual-regulaciones.md). Es contenido estático: no se pide nada a internet.

import datos from "@/data/regulaciones.json";
import { FICHAS } from "@/lib/licencias";

export type Destinatario =
  | "todos"
  | "avion"
  | "planeador"
  | "ultraliviano"
  | "alumnos"
  | "instructores"
  | "examinadores"
  | "ciac"
  | "aerodromos"
  | "explotadores"
  | "propietarios";

export type Impacto = "alto" | "medio" | "bajo";

/** "confirmado" solo si se abrió la fuente oficial (Boletín Oficial, ANAC o InfoLEG). */
export type EstadoCambio = "confirmado" | "sin-confirmar";

export type FechaClave = {
  /** AAAA-MM-DD */
  fecha: string;
  descripcion: string;
  /** true si la fecha es una estimación (por ejemplo, "180 días hábiles"). */
  aproximada?: boolean;
};

export type Enlace = { titulo: string; url: string };

export type Cambio = {
  /** Estable, no cambiarlo nunca: "res-anac-65-2026", "disp-dnso-70-2026", "dnu-274-2026". */
  id: string;
  /** Fecha de publicación en el Boletín Oficial (AAAA-MM-DD). */
  fechaPublicacion: string;
  tipo: string;
  numero: string;
  organismo: string;
  titulo: string;
  /** Partes de las RAAC (o normas) que toca. */
  partes: string[];
  /** Resumen en lenguaje claro, con nuestras palabras. */
  resumen: string;
  aQuienAfecta: Destinatario[];
  impacto: Impacto;
  /** Enlace oficial principal (preferentemente el aviso del Boletín Oficial). */
  enlace: string;
  enlacesExtra?: Enlace[];
  estado: EstadoCambio;
  fechasClave?: FechaClave[];
  /** Ids de fichas de /licencias que este cambio modifica. */
  fichas?: string[];
  notas?: string;
};

export type FuenteMonitoreada = { id: string; nombre: string; url: string; que: string };

export type DatosRegulaciones = {
  ultimaRevision: string;
  /** Fecha hasta la que se buscaron normas publicadas. La próxima corrida busca desde acá. */
  revisadoHasta: string;
  frecuencia: string;
  fuentesMonitoreadas: FuenteMonitoreada[];
  cambios: Cambio[];
};

const DATOS = datos as DatosRegulaciones;

export const ULTIMA_REVISION = DATOS.ultimaRevision;
export const REVISADO_HASTA = DATOS.revisadoHasta;
export const FRECUENCIA = DATOS.frecuencia;
export const FUENTES_MONITOREADAS = DATOS.fuentesMonitoreadas;

/** Más recientes primero; a igual fecha, por id para que el orden sea estable. */
export const CAMBIOS: Cambio[] = [...DATOS.cambios].sort(
  (a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion) || a.id.localeCompare(b.id),
);

export const NOMBRE_DESTINATARIO: Record<Destinatario, string> = {
  todos: "Todos los pilotos",
  avion: "Avión",
  planeador: "Planeador",
  ultraliviano: "Ultraliviano / LSA",
  alumnos: "Alumnos",
  instructores: "Instructores",
  examinadores: "Examinadores",
  ciac: "CIAC / escuelas",
  aerodromos: "Aeródromos",
  explotadores: "Explotadores",
  propietarios: "Propietarios de aeronaves",
};

export const NOMBRE_IMPACTO: Record<Impacto, string> = { alto: "Alto", medio: "Medio", bajo: "Bajo" };

/** Destinatarios que aparecen en al menos un cambio, en el orden de NOMBRE_DESTINATARIO. */
export function destinatariosUsados(cambios: Cambio[] = CAMBIOS): Destinatario[] {
  const usados = new Set(cambios.flatMap((c) => c.aQuienAfecta));
  return (Object.keys(NOMBRE_DESTINATARIO) as Destinatario[]).filter((d) => usados.has(d));
}

export type Plazo = FechaClave & { cambio: Pick<Cambio, "id" | "tipo" | "numero" | "titulo"> };

/**
 * Fechas clave posteriores a `desde` (AAAA-MM-DD), de la más cercana a la más lejana.
 * La página usa la fecha de la última revisión, así el resultado no depende de cuándo se compiló.
 */
export function plazosQueVienen(desde: string = ULTIMA_REVISION, cambios: Cambio[] = CAMBIOS): Plazo[] {
  return cambios
    .flatMap((c) =>
      (c.fechasClave ?? []).map((f) => ({
        ...f,
        cambio: { id: c.id, tipo: c.tipo, numero: c.numero, titulo: c.titulo },
      })),
    )
    .filter((p) => p.fecha > desde)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.cambio.id.localeCompare(b.cambio.id));
}

/** Nombre de una ficha de /licencias por id (undefined si no existe). */
export function nombreFicha(id: string): string | undefined {
  return FICHAS.find((f) => f.id === id)?.nombre;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const DOMINIOS_OFICIALES = ["boletinoficial.gob.ar", "argentina.gob.ar", "infoleg.gob.ar", "anac.gob.ar", "eana.com.ar"];

/** Controles de consistencia del JSON (ids, fechas, enlaces, fichas). Lista vacía = todo bien. */
export function problemasDelInforme(): string[] {
  const problemas: string[] = [];
  const ids = new Set<string>();
  const fichas = new Set(FICHAS.map((f) => f.id));
  const destinatarios = new Set(Object.keys(NOMBRE_DESTINATARIO));
  if (!FECHA.test(DATOS.ultimaRevision)) problemas.push("ultimaRevision con formato inválido");
  if (!FECHA.test(DATOS.revisadoHasta)) problemas.push("revisadoHasta con formato inválido");
  for (const c of DATOS.cambios) {
    if (ids.has(c.id)) problemas.push(`${c.id}: id repetido`);
    ids.add(c.id);
    if (!FECHA.test(c.fechaPublicacion)) problemas.push(`${c.id}: fechaPublicacion inválida`);
    if (c.fechaPublicacion > DATOS.revisadoHasta) problemas.push(`${c.id}: publicada después de revisadoHasta`);
    if (!["alto", "medio", "bajo"].includes(c.impacto)) problemas.push(`${c.id}: impacto inválido`);
    if (!["confirmado", "sin-confirmar"].includes(c.estado)) problemas.push(`${c.id}: estado inválido`);
    if (c.aQuienAfecta.length === 0) problemas.push(`${c.id}: sin destinatarios`);
    for (const d of c.aQuienAfecta) if (!destinatarios.has(d)) problemas.push(`${c.id}: destinatario ${d} desconocido`);
    for (const f of c.fichas ?? []) if (!fichas.has(f)) problemas.push(`${c.id}: ficha ${f} inexistente`);
    for (const f of c.fechasClave ?? []) if (!FECHA.test(f.fecha)) problemas.push(`${c.id}: fecha clave inválida`);
    const host = (() => {
      try {
        return new URL(c.enlace).hostname;
      } catch {
        return "";
      }
    })();
    if (c.estado === "confirmado" && !DOMINIOS_OFICIALES.some((d) => host === d || host.endsWith(`.${d}`)))
      problemas.push(`${c.id}: confirmado sin enlace oficial`);
  }
  return problemas;
}

export { fechaCorta } from "@/lib/licencias";
