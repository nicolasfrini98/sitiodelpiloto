// Imágenes del satélite GOES-19 (GOES-Este) publicadas por NOAA/NESDIS STAR.
// Sector "ssa" = Southern South America. Las imágenes son de dominio público.
import { cacheLife } from "next/cache";
import type { Resultado } from "./aviationweather";

const BASE = "https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/ssa";
const TAMANIO = "1800x1080";

export type ProductoGoes = "GEOCOLOR" | "13";

export const PRODUCTOS_GOES: Record<ProductoGoes, string> = {
  GEOCOLOR: "GeoColor (color real de día, infrarrojo de noche)",
  "13": "Infrarrojo banda 13 (10,3 µm, topes nubosos)",
};

export type ImagenGoes = {
  producto: ProductoGoes;
  url: string;
  /** Hora de inicio del barrido, en segundos epoch UTC. */
  hora: number;
  pagina: string;
};

/** Pasa "20263290320" (año, día juliano, HHMM) a epoch UTC. */
function horaDesdeNombre(sello: string): number {
  const anio = Number(sello.slice(0, 4));
  const diaJuliano = Number(sello.slice(4, 7));
  const hh = Number(sello.slice(7, 9));
  const mm = Number(sello.slice(9, 11));
  return Date.UTC(anio, 0, diaJuliano, hh, mm) / 1000;
}

/**
 * Última imagen del sector sur de Sudamérica. Lee el índice del directorio para conocer el nombre
 * con fecha (así la URL es estable y sabemos la hora exacta del barrido).
 */
export async function obtenerImagenGoes(producto: ProductoGoes): Promise<Resultado<ImagenGoes>> {
  "use cache";
  cacheLife("minutes");
  const pagina = `https://www.star.nesdis.noaa.gov/GOES/sector.php?sat=G19&sector=ssa`;
  try {
    const res = await fetch(`${BASE}/${producto}/`);
    if (!res.ok) return { ok: false, error: `NOAA STAR respondió ${res.status}` };
    const html = await res.text();
    const patron = new RegExp(String.raw`href="((\d{11})_GOES19-ABI-ssa-${producto}-${TAMANIO}\.jpg)"`, "g");
    let ultimo: { archivo: string; sello: string } | null = null;
    for (const m of html.matchAll(patron)) {
      if (!ultimo || m[2] > ultimo.sello) ultimo = { archivo: m[1], sello: m[2] };
    }
    if (!ultimo) return { ok: false, error: "No se encontró ninguna imagen reciente en NOAA STAR" };
    return {
      ok: true,
      datos: { producto, url: `${BASE}/${producto}/${ultimo.archivo}`, hora: horaDesdeNombre(ultimo.sello), pagina },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}
