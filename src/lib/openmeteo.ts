// Pronóstico numérico horario de Open-Meteo (https://open-meteo.com/en/docs). Público, sin clave,
// licencia CC BY 4.0. Es salida de modelo ("best match"), no un pronóstico oficial del SMN.
import { cacheLife } from "next/cache";
import type { Resultado } from "./aviationweather";

const BASE = "https://api.open-meteo.com/v1/forecast";

const VARIABLES = [
  "temperature_2m",
  "dew_point_2m",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "wind_speed_850hPa",
  "wind_direction_850hPa",
  "wind_speed_700hPa",
  "wind_direction_700hPa",
  "cape",
  "boundary_layer_height",
  "cloud_cover_low",
  "precipitation",
  "is_day",
] as const;

type Variable = (typeof VARIABLES)[number];

type RespuestaOpenMeteo = {
  elevation: number;
  utc_offset_seconds: number;
  hourly: { time: number[] } & Record<Variable, (number | null)[]>;
};

export type HoraPronostico = {
  hora: number; // segundos epoch UTC
  temp: number | null;
  rocio: number | null;
  vientoDir: number | null;
  vientoVel: number | null; // kt
  rafaga: number | null; // kt
  dir850: number | null;
  vel850: number | null; // kt
  dir700: number | null;
  vel700: number | null; // kt
  cape: number | null; // J/kg
  capaLimite: number | null; // m sobre el terreno
  nubesBajas: number | null; // %
  precipitacion: number | null; // mm en la hora previa
  esDeDia: boolean;
};

export type Pronostico = {
  /** Elevación del punto de grilla del modelo (m). */
  elevacionModelo: number;
  horas: HoraPronostico[];
};

/** Pronóstico horario de hoy y mañana (días locales de Argentina) para un punto. */
export async function obtenerPronostico(lat: number, lon: number): Promise<Resultado<Pronostico>> {
  "use cache";
  cacheLife("hours");
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: VARIABLES.join(","),
    wind_speed_unit: "kn",
    timeformat: "unixtime",
    timezone: "America/Argentina/Buenos_Aires",
    forecast_days: "2",
  });
  try {
    const res = await fetch(`${BASE}?${params}`);
    if (!res.ok) return { ok: false, error: `Open-Meteo respondió ${res.status}` };
    const d = (await res.json()) as RespuestaOpenMeteo;
    const h = d.hourly;
    const horas: HoraPronostico[] = h.time.map((hora, i) => ({
      hora,
      temp: h.temperature_2m[i],
      rocio: h.dew_point_2m[i],
      vientoDir: h.wind_direction_10m[i],
      vientoVel: h.wind_speed_10m[i],
      rafaga: h.wind_gusts_10m[i],
      dir850: h.wind_direction_850hPa[i],
      vel850: h.wind_speed_850hPa[i],
      dir700: h.wind_direction_700hPa[i],
      vel700: h.wind_speed_700hPa[i],
      cape: h.cape[i],
      capaLimite: h.boundary_layer_height[i],
      nubesBajas: h.cloud_cover_low[i],
      precipitacion: h.precipitation[i],
      esDeDia: h.is_day[i] === 1,
    }));
    return { ok: true, datos: { elevacionModelo: d.elevation, horas } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}

// ---------------------------------------------------------------------------
// Criterio orientativo de térmicas. Es una heurística simple, no un pronóstico de térmicas:
// sirve para ubicar la ventana del día que vale la pena mirar con más detalle (sondeo, TAF, SIGMET).

/** Base estimada de cúmulos sobre el terreno (ft AGL): (T − Td) × 400, la misma fórmula que en /metar. */
export function baseCumulosPronostico(h: HoraPronostico): number | null {
  if (h.temp == null || h.rocio == null) return null;
  return Math.max(0, Math.round(((h.temp - h.rocio) * 400) / 100) * 100);
}

export type CalidadTermica = "buena" | "aceptable" | "no";

export const CRITERIO_TERMICAS = {
  buena: [
    "Es de día",
    "Capa límite ≥ 1200 m",
    "Base estimada de cúmulos ≥ 3500 ft AGL",
    "Viento en 10 m ≤ 15 kt y ráfaga ≤ 25 kt",
    "Viento en 850 hPa ≤ 20 kt",
    "Nubosidad baja ≤ 50 %",
    "Sin precipitación",
    "CAPE < 1000 J/kg (menos riesgo de sobredesarrollo y tormentas)",
  ],
  aceptable: "Igual, pero con capa límite ≥ 800 m, base ≥ 2500 ft AGL y viento en 850 hPa ≤ 25 kt.",
};

export function calidadTermica(h: HoraPronostico): CalidadTermica {
  const base = baseCumulosPronostico(h);
  const datos = [h.capaLimite, base, h.vientoVel, h.rafaga, h.vel850, h.nubesBajas, h.precipitacion, h.cape];
  if (!h.esDeDia || datos.some((v) => v == null)) return "no";
  const comunes =
    h.vientoVel! <= 15 && h.rafaga! <= 25 && h.nubesBajas! <= 50 && h.precipitacion! < 0.1 && h.cape! < 1000;
  if (!comunes) return "no";
  if (h.capaLimite! >= 1200 && base! >= 3500 && h.vel850! <= 20) return "buena";
  if (h.capaLimite! >= 800 && base! >= 2500 && h.vel850! <= 25) return "aceptable";
  return "no";
}
