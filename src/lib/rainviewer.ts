// Radar compuesto de RainViewer (https://www.rainviewer.com/api.html). Público y sin clave.
// La cobertura en Argentina depende de los radares que RainViewer integre: puede haber zonas sin datos.
import { cacheLife } from "next/cache";
import type { Resultado } from "./aviationweather";

const URL_MAPAS = "https://api.rainviewer.com/public/weather-maps.json";

export type CuadroRadar = {
  /** Plantilla de teselas para Leaflet: {z}/{x}/{y}. */
  plantilla: string;
  /** Hora del cuadro, en segundos epoch UTC. */
  hora: number;
};

type RespuestaMapas = {
  host: string;
  radar: { past: { time: number; path: string }[] };
};

/** Último cuadro de radar disponible ("radar.past" más reciente). */
export async function obtenerUltimoRadar(): Promise<Resultado<CuadroRadar>> {
  "use cache";
  cacheLife("minutes");
  try {
    const res = await fetch(URL_MAPAS);
    if (!res.ok) return { ok: false, error: `RainViewer respondió ${res.status}` };
    const d = (await res.json()) as RespuestaMapas;
    const ultimo = d.radar?.past?.at(-1);
    if (!d.host || !ultimo) return { ok: false, error: "RainViewer no publicó cuadros de radar" };
    // 256 px, esquema de color 2 (Universal Blue), suavizado 1, nieve 1.
    return { ok: true, datos: { plantilla: `${d.host}${ultimo.path}/256/{z}/{x}/{y}/2/1_1.png`, hora: ultimo.time } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}
