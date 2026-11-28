// Datos del servicio de información aeronáutica de la ANAC (ais.anac.gob.ar), pedidos en tiempo real:
// - MADHEL: Manual de Aeródromos y Helipuertos (https://ais.anac.gob.ar/madhel), API pública de datos.anac.gob.ar.
// - NOTAM: los activos de las series A y C por lugar, del mismo servicio que usa la consulta web de la ANAC.
// Ambos se identifican con el designador local de 3 letras (AER, EZE...), no con el OACI.
import { cacheLife } from "next/cache";
import type { Resultado } from "./aviationweather";

const MADHEL = "https://datos.anac.gob.ar/madhel/api/v2/airports/";
const NOTAM = "https://ais.anac.gob.ar/notam/json";
// Los servidores de la ANAC a veces no responden: cortamos a los 10 s y mostramos el error.
const TIEMPO_MAX = 10_000;
const HEADERS = {
  "User-Agent": "sitiodelpiloto/0.1 (+https://github.com/nicolasfrini98/sitiodelpiloto)",
};

export const URL_MADHEL = "https://ais.anac.gob.ar/madhel/";
export const URL_NOTAM_ANAC = "https://ais.anac.gob.ar/notam";
export const URL_AIP_ANAC = "https://ais.anac.gob.ar/aip";

/** Mensaje en castellano para los errores de red (fetch tira mensajes en inglés como "fetch failed"). */
function mensajeError(e: unknown): string {
  if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError"))
    return "el servidor de la ANAC no respondió a tiempo";
  if (e instanceof Error && e.message === "fetch failed") return "no se pudo conectar con el servidor de la ANAC";
  return e instanceof Error ? e.message : "error de red";
}

/**
 * Fija la vida en cache según el resultado: los datos buenos duran lo pedido; los errores, un minuto,
 * para que una caída momentánea de la ANAC no quede guardada por horas.
 */
type Vida = "days" | { stale: number; revalidate: number; expire: number };
function vida<T>(r: Resultado<T>, siOk: Vida): Resultado<T> {
  if (!r.ok) cacheLife({ stale: 30, revalidate: 60, expire: 120 });
  else if (siOk === "days") cacheLife("days");
  else cacheLife(siOk);
  return r;
}

type ItemMadhel = {
  local_identifier: string;
  human_readable_identifier: string;
};

/** OACI → designador local, sacado de los nombres del MADHEL ("JUNÍN - (NIN / SAAJ) - ..."). */
async function indiceMadhel(): Promise<Resultado<Record<string, string>>> {
  "use cache";
  return vida(await indiceMadhelSinCache(), "days");
}

async function indiceMadhelSinCache(): Promise<Resultado<Record<string, string>>> {
  try {
    const res = await fetch(MADHEL, { headers: HEADERS, signal: AbortSignal.timeout(TIEMPO_MAX) });
    if (!res.ok)
      return {
        ok: false,
        error: `El MADHEL de la ANAC respondió ${res.status}`,
      };
    const json = (await res.json()) as { results: ItemMadhel[] };
    const mapa: Record<string, string> = {};
    for (const a of json.results) {
      const m = a.human_readable_identifier.match(/\(([A-Z0-9]{3,4}) \/ ([A-Z]{4})\)/);
      if (m) mapa[m[2]] = m[1];
    }
    return { ok: true, datos: mapa };
  } catch (e) {
    return {
      ok: false,
      error: mensajeError(e),
    };
  }
}

/** Designador local ANAC de un aeródromo, o null si el MADHEL no lo tiene. */
export async function designadorLocal(icao: string): Promise<Resultado<string | null>> {
  const r = await indiceMadhel();
  if (!r.ok) return r;
  return { ok: true, datos: r.datos[icao.toUpperCase()] ?? null };
}

export type FichaMadhel = {
  local: string;
  nombre: string;
  /** Frecuencias de los servicios de tránsito aéreo, como las escribe el MADHEL. */
  ats: string[];
  /** Radioayudas (VOR, NDB...), como las escribe el MADHEL. */
  radioayudas: string[];
  horario: string;
  telefonos: string[];
  combustible: string;
  /** true cuando el MADHEL remite al AIP (aeródromos grandes). */
  remiteAlAip: boolean;
  actualizado: string;
};

export async function obtenerFichaMadhel(local: string): Promise<Resultado<FichaMadhel>> {
  "use cache";
  return vida(await fichaMadhelSinCache(local), "days");
}

async function fichaMadhelSinCache(local: string): Promise<Resultado<FichaMadhel>> {
  try {
    const res = await fetch(`${MADHEL}${encodeURIComponent(local)}/?format=json`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(TIEMPO_MAX),
    });
    if (!res.ok)
      return {
        ok: false,
        error: `El MADHEL de la ANAC respondió ${res.status}`,
      };
    const j = await res.json();
    const d = j.data ?? {};
    const lista = (v: unknown) =>
      Array.isArray(v)
        ? v
            .map(String)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    return {
      ok: true,
      datos: {
        local,
        nombre: String(j.human_readable_identifier ?? local),
        ats: lista(d.ats),
        radioayudas: lista(d.helpers_system?.radio),
        horario: String(d.service_schedule ?? "").trim(),
        telefonos: lista(d.telephone),
        combustible: String(d.fuel ?? "").trim(),
        remiteAlAip: /Consultar en el sitio web/i.test(String(d.human_readable_localization ?? "")),
        actualizado: String(j.updated_at ?? ""),
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: mensajeError(e),
    };
  }
}

export type Notam = {
  numero: string;
  /** Inicio y fin en UTC, ISO 8601. `hasta` null = permanente o sin fecha de fin informada. */
  desde: string | null;
  hasta: string | null;
  /** Texto original (en inglés, abreviaturas OACI). */
  texto: string;
  /** Versión en español que publica la ANAC, si la hay. */
  textoEs: string | null;
};

type NotamCrudo = {
  notam: string;
  desde: string;
  hasta: string;
  novedad: string;
};

function fechaUtc(s: string | undefined): string | null {
  const m = s?.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}:00Z` : null;
}

function sinHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** NOTAM activos (series A y C) de un lugar, por designador local. */
export async function obtenerNotams(local: string): Promise<Resultado<Notam[]>> {
  "use cache";
  return vida(await notamsSinCache(local), { stale: 300, revalidate: 900, expire: 3600 });
}

async function notamsSinCache(local: string): Promise<Resultado<Notam[]>> {
  try {
    const res = await fetch(NOTAM, {
      method: "POST",
      headers: {
        ...HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `indicador=${encodeURIComponent(local)}`,
      signal: AbortSignal.timeout(TIEMPO_MAX),
    });
    if (!res.ok)
      return {
        ok: false,
        error: `El servicio de NOTAM de la ANAC respondió ${res.status}`,
      };
    const crudos = (await res.json()) as NotamCrudo[];
    if (!Array.isArray(crudos)) return { ok: false, error: "Respuesta inesperada del servicio de NOTAM" };
    const notams = crudos.map((n) => {
      const [en, es] = n.novedad.split(/<span id="versionbreak">[^<]*<\/span>/);
      const texto = sinHtml(en ?? "");
      const textoEs = es ? sinHtml(es) : null;
      return {
        numero: n.notam,
        desde: fechaUtc(n.desde),
        hasta: fechaUtc(n.hasta),
        texto,
        textoEs: textoEs && textoEs !== texto ? textoEs : null,
      };
    });
    notams.sort((a, b) => (a.desde ?? "").localeCompare(b.desde ?? ""));
    return { ok: true, datos: notams };
  } catch (e) {
    return {
      ok: false,
      error: mensajeError(e),
    };
  }
}
