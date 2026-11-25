// Acceso a la Data API de aviationweather.gov (NOAA). Es pública y no requiere clave.
// Docs: https://aviationweather.gov/data/api/
import { cacheLife } from "next/cache";

const BASE = "https://aviationweather.gov/api/data";
const HEADERS = { "User-Agent": "sitiodelpiloto/0.1 (+https://github.com/nicolasfrini98/sitiodelpiloto)" };

export type Capa = { cover: string; base: number | null; type?: string | null };

export type Metar = {
  icaoId: string;
  obsTime: number; // segundos epoch UTC
  reportTime: string;
  temp: number | null;
  dewp: number | null;
  wdir: number | "VRB" | null;
  wspd: number | null;
  wgst?: number | null;
  visib: number | string | null; // millas terrestres, ej "6+"
  altim: number | null; // hPa
  wxString?: string | null;
  metarType: "METAR" | "SPECI";
  rawOb: string;
  lat: number;
  lon: number;
  elev: number; // metros
  name: string;
  cover?: string;
  clouds: Capa[];
  fltCat?: "VFR" | "MVFR" | "IFR" | "LIFR" | null;
};

export type Taf = {
  icaoId: string;
  issueTime: string;
  validTimeFrom: number;
  validTimeTo: number;
  rawTAF: string;
  name: string;
};

export type Resultado<T> = { ok: true; datos: T } | { ok: false; error: string };

async function pedir<T>(ruta: string, vacio: T): Promise<Resultado<T>> {
  try {
    const res = await fetch(`${BASE}/${ruta}`, { headers: HEADERS });
    if (res.status === 204) return { ok: true, datos: vacio };
    if (!res.ok) return { ok: false, error: `aviationweather.gov respondió ${res.status}` };
    return { ok: true, datos: (await res.json()) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}

/** Último METAR/SPECI de cada estación pedida (busca hasta `horas` atrás). */
export async function obtenerMetars(icaos: string[], horas = 3): Promise<Resultado<Metar[]>> {
  "use cache";
  cacheLife("minutes");
  const r = await pedir<Metar[]>(`metar?ids=${icaos.join(",")}&format=json&hours=${horas}`, []);
  if (!r.ok) return r;
  const ultimo = new Map<string, Metar>();
  for (const m of r.datos) {
    const previo = ultimo.get(m.icaoId);
    if (!previo || m.obsTime > previo.obsTime) ultimo.set(m.icaoId, m);
  }
  return { ok: true, datos: [...ultimo.values()] };
}

/** Todos los METAR/SPECI de una estación en las últimas `horas`, del más nuevo al más viejo. */
export async function obtenerHistorialMetar(icao: string, horas = 12): Promise<Resultado<Metar[]>> {
  "use cache";
  cacheLife("minutes");
  const r = await pedir<Metar[]>(`metar?ids=${icao}&format=json&hours=${horas}`, []);
  if (!r.ok) return r;
  return { ok: true, datos: [...r.datos].sort((a, b) => b.obsTime - a.obsTime) };
}

/** TAF vigente de una estación, o null si no publica. */
export async function obtenerTaf(icao: string): Promise<Resultado<Taf | null>> {
  "use cache";
  cacheLife("minutes");
  const r = await pedir<Taf[]>(`taf?ids=${icao}&format=json`, []);
  if (!r.ok) return r;
  return { ok: true, datos: r.datos[0] ?? null };
}

// ---------------------------------------------------------------------------
// SIGMET internacionales (endpoint isigmet). Devuelve todos los del mundo; filtramos por FIR.

/** FIR argentinas: Ezeiza, Córdoba, Mendoza, Resistencia y Comodoro Rivadavia. */
export const FIR_ARGENTINAS = ["SAEF", "SACF", "SAMF", "SARR", "SAVF"] as const;

export type Sigmet = {
  icaoId: string; // oficina emisora (MWO), ej. SABE
  firId: string;
  firName: string;
  receiptTime: string;
  validTimeFrom: number; // segundos epoch UTC
  validTimeTo: number;
  seriesId: string;
  hazard: string; // TS, TURB, ICE, MTW, VA, TC…
  qualifier: string | null; // EMBD, SEV, OBSC…
  base: number | null; // ft
  top: number | null; // ft
  geom: string;
  coords: { lat: number; lon: number }[] | null;
  dir: string | null;
  spd: string | null;
  chng: string | null; // INTSF, WKN, NC
  rawSigmet: string;
};

/** SIGMET vigentes en las FIR argentinas, ordenados por FIR y vigencia. */
export async function obtenerSigmetArgentina(): Promise<Resultado<Sigmet[]>> {
  "use cache";
  cacheLife("minutes");
  const r = await pedir<Sigmet[]>("isigmet?format=json", []);
  if (!r.ok) return r;
  // Dentro de "use cache" la hora queda fijada junto con el resultado (se recalcula al revalidar).
  const ahora = Date.now() / 1000;
  const firs: readonly string[] = FIR_ARGENTINAS;
  const datos = r.datos
    .filter((s) => firs.includes(s.firId) && s.validTimeTo > ahora)
    .sort((a, b) => a.firId.localeCompare(b.firId) || a.validTimeFrom - b.validTimeFrom);
  return { ok: true, datos };
}
