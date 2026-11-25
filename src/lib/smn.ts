// Alertas del Servicio Meteorológico Nacional en formato CAP (Common Alerting Protocol, OASIS 1.2).
// El SMN publica un RSS índice con un ítem por zona alertada, y cada ítem apunta a un XML CAP con
// evento, severidad, vigencia y polígono. Es el feed que el SMN registra ante la OMM (WMO Alert Hub).
// Público, sin clave. Licencia CC BY 4.0 (según el propio feed).
import { cacheLife } from "next/cache";
import type { Resultado } from "./aviationweather";

const URL_RSS = "https://ssl.smn.gob.ar/CAP/AR.php";
const PREFIJO_CAP = "https://ssl.smn.gob.ar/feeds/CAP/";
const MAX_ARCHIVOS = 250;
const CONCURRENCIA = 8;

export type NivelAlerta = "amarilla" | "naranja" | "roja";

/**
 * Un grupo de zonas con el mismo aviso (mismo evento, nivel y texto). `desde`/`hasta` abarcan todos
 * los períodos del grupo: una zona puntual puede estar alertada solo en parte de ese intervalo.
 */
export type AlertaSmn = {
  evento: string;
  nivel: NivelAlerta;
  descripcion: string;
  desde: number; // segundos epoch UTC
  hasta: number;
  zonas: number;
  /** Polígonos [lat, lon] de cada zona. */
  poligonos: [number, number][][];
};

type AvisoCap = {
  evento: string;
  severidad: string;
  descripcion: string;
  desde: number;
  hasta: number;
  poligonos: [number, number][][];
};

function decodificar(texto: string): string {
  return texto
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function etiqueta(xml: string, nombre: string): string | null {
  const m = xml.match(new RegExp(`<${nombre}>([\\s\\S]*?)</${nombre}>`));
  return m ? decodificar(m[1]) : null;
}

/** Severidad CAP → nivel del sistema de alertas tempranas del SMN. */
function nivelDesdeSeveridad(severidad: string): NivelAlerta | null {
  if (severidad === "Extreme") return "roja";
  if (severidad === "Severe") return "naranja";
  if (severidad === "Moderate" || severidad === "Minor") return "amarilla";
  return null;
}

function leerCap(xml: string): AvisoCap | null {
  if (etiqueta(xml, "msgType") === "Cancel" || etiqueta(xml, "status") !== "Actual") return null;
  const evento = etiqueta(xml, "event");
  const severidad = etiqueta(xml, "severity");
  const desde = Date.parse(etiqueta(xml, "onset") ?? etiqueta(xml, "effective") ?? "");
  const hasta = Date.parse(etiqueta(xml, "expires") ?? "");
  if (!evento || !severidad || Number.isNaN(desde) || Number.isNaN(hasta)) return null;
  const poligonos = [...xml.matchAll(/<polygon>([\s\S]*?)<\/polygon>/g)].map((m) =>
    m[1]
      .trim()
      .split(/\s+/)
      .map((par) => par.split(",").map(Number) as [number, number])
      .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon)),
  );
  return {
    evento,
    severidad,
    descripcion: etiqueta(xml, "description") ?? "",
    desde: desde / 1000,
    hasta: hasta / 1000,
    poligonos,
  };
}

async function pedirTexto(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

/** Alertas vigentes del SMN, agrupadas por aviso. Lista vacía = no hay alertas. */
export async function obtenerAlertasSmn(): Promise<Resultado<AlertaSmn[]>> {
  "use cache";
  // Son ~100 archivos chicos por consulta: no hace falta pedirlos más seguido que cada 10 min.
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 });

  const rss = await pedirTexto(URL_RSS);
  if (rss == null) return { ok: false, error: "No se pudo leer el feed CAP del SMN" };

  const enlaces = [
    ...new Set(
      [...rss.matchAll(/<item>[\s\S]*?<link>([\s\S]*?)<\/link>/g)]
        .map((m) => decodificar(m[1]))
        .filter((u) => u.startsWith(PREFIJO_CAP)),
    ),
  ].slice(0, MAX_ARCHIVOS);

  const avisos: AvisoCap[] = [];
  let fallidos = 0;
  for (let i = 0; i < enlaces.length; i += CONCURRENCIA) {
    const lote = await Promise.all(enlaces.slice(i, i + CONCURRENCIA).map(pedirTexto));
    for (const xml of lote) {
      const aviso = xml ? leerCap(xml) : null;
      if (aviso) avisos.push(aviso);
      else if (!xml) fallidos++;
    }
  }
  if (enlaces.length > 0 && fallidos === enlaces.length) {
    return { ok: false, error: "El SMN no respondió los avisos CAP" };
  }

  const ahora = Date.now() / 1000;
  const grupos = new Map<string, AlertaSmn>();
  for (const a of avisos) {
    const nivel = nivelDesdeSeveridad(a.severidad);
    if (!nivel || a.hasta <= ahora) continue;
    // El SMN emite un CAP por zona y por período: agrupamos por aviso y unimos los períodos.
    const clave = [a.evento, nivel, a.descripcion].join("|");
    const g = grupos.get(clave);
    if (g) {
      g.desde = Math.min(g.desde, a.desde);
      g.hasta = Math.max(g.hasta, a.hasta);
      g.poligonos.push(...a.poligonos);
    } else {
      grupos.set(clave, { ...a, nivel, zonas: 0, poligonos: [...a.poligonos] });
    }
  }
  // Una misma zona puede repetirse en varios períodos: la contamos y dibujamos una sola vez.
  for (const g of grupos.values()) {
    const unicos = new Map(g.poligonos.map((p) => [p.map(([la, lo]) => `${la},${lo}`).join(" "), p]));
    g.poligonos = [...unicos.values()];
    g.zonas = Math.max(1, g.poligonos.length);
  }
  const orden: Record<NivelAlerta, number> = { roja: 0, naranja: 1, amarilla: 2 };
  const datos = [...grupos.values()]
    .map(({ evento, nivel, descripcion, desde, hasta, zonas, poligonos }) => ({
      evento,
      nivel,
      descripcion,
      desde,
      hasta,
      zonas,
      // Simplificamos los polígonos a 3 decimales para no inflar el HTML.
      poligonos: poligonos.map((p) => p.map(([la, lo]) => [Math.round(la * 1e3) / 1e3, Math.round(lo * 1e3) / 1e3] as [number, number])),
    }))
    .sort((x, y) => orden[x.nivel] - orden[y.nivel] || x.desde - y.desde || x.evento.localeCompare(y.evento));
  return { ok: true, datos };
}
