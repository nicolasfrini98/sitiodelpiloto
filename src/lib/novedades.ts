// Agregador de noticias de aviación para pilotos argentinos (planeador y avión).
// Cada fuente se pide por separado, con su propio cache de horas, y devuelve `Resultado<T>`:
// si una fuente se cae, el resto se sigue mostrando. Solo se guarda título, un resumen corto en texto
// plano y el enlace a la nota original: nunca el artículo completo.
//
// Fuentes probadas con curl (nov. 2026). Las descartadas y el motivo están al final del archivo.
import { cacheLife } from "next/cache";
import type { Resultado } from "./aviationweather";

export type CategoriaNovedad = "Vuelo a vela" | "Aviación general" | "Oficial (ANAC/EANA)" | "Internacional";

export const CATEGORIAS_NOVEDADES: CategoriaNovedad[] = [
  "Vuelo a vela",
  "Aviación general",
  "Oficial (ANAC/EANA)",
  "Internacional",
];

export type Novedad = {
  /** Enlace a la nota original (también sirve de clave). */
  enlace: string;
  titulo: string;
  /** Milisegundos epoch UTC; null si la fuente no trae fecha legible. */
  fecha: number | null;
  /** Fecha legible en hora argentina ("24 nov 2026"), armada en el servidor para no desajustar la hidratación. */
  fechaTexto: string | null;
  /** Nombre corto de la fuente, para el chip. */
  fuente: string;
  fuenteId: string;
  categoria: CategoriaNovedad;
  /** Texto plano, sin HTML, recortado a ~200 caracteres. */
  resumen: string;
  imagen: string | null;
  /** Idioma de la nota (las fuentes internacionales vienen en inglés). */
  idioma: "es" | "en";
};

type Formato = "rss" | "html-argentina-gob-ar";

type DefinicionFuente = {
  id: string;
  nombre: string;
  sitio: string;
  url: string;
  formato: Formato;
  categoria: CategoriaNovedad;
  idioma: "es" | "en";
  /** Descarta ítems que no son noticias para pilotos (licitaciones, notas en otro idioma, etc.). */
  incluir?: (n: { titulo: string; enlace: string }) => boolean;
};

export type EstadoFuente = {
  id: string;
  nombre: string;
  sitio: string;
  categoria: CategoriaNovedad;
  ok: boolean;
  items: number;
  error?: string;
};

export type NovedadesAgregadas = {
  novedades: Novedad[];
  fuentes: EstadoFuente[];
};

const FORMATO_FECHA = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});
const MAX_POR_FUENTE = 15;
const LARGO_RESUMEN = 200;
const TIMEOUT_MS = 12_000;
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; SitioDelPiloto/1.0; agregador de noticias)" };

export const FUENTES_NOVEDADES: DefinicionFuente[] = [
  {
    id: "anac",
    nombre: "ANAC",
    sitio: "https://www.argentina.gob.ar/anac/noticias",
    // La ANAC no publica RSS: se lee el listado de noticias de argentina.gob.ar (HTML estable del portal).
    url: "https://www.argentina.gob.ar/anac/noticias",
    formato: "html-argentina-gob-ar",
    categoria: "Oficial (ANAC/EANA)",
    idioma: "es",
  },
  {
    id: "eana",
    nombre: "EANA",
    sitio: "https://www.eana.com.ar/",
    url: "https://www.eana.com.ar/rss.xml",
    formato: "rss",
    categoria: "Oficial (ANAC/EANA)",
    idioma: "es",
    // El feed mezcla noticias con licitaciones y compras: nos quedamos con las noticias.
    incluir: ({ titulo }) => !/^\s*(licitaci[oó]n|contrataci[oó]n|concurso de precios|compra)/i.test(titulo),
  },
  {
    id: "aviacionline",
    nombre: "Aviacionline",
    sitio: "https://www.aviacionline.com/",
    url: "https://www.aviacionline.com/rss.xml",
    formato: "rss",
    categoria: "Aviación general",
    idioma: "es",
    // Publica cada nota en español y en inglés: solo las de la edición en español.
    incluir: ({ enlace }) => enlace.includes("/espanol/"),
  },
  {
    id: "gaceta",
    nombre: "Gaceta Aeronáutica",
    sitio: "https://www.gacetaeronautica.com/",
    url: "https://www.gacetaeronautica.com/gaceta/wp-101/feed",
    formato: "rss",
    categoria: "Aviación general",
    idioma: "es",
  },
  {
    id: "gliding-australia",
    nombre: "Gliding Australia",
    sitio: "https://www.glidingaustralia.org/",
    url: "https://www.glidingaustralia.org/feed",
    formato: "rss",
    categoria: "Vuelo a vela",
    idioma: "en",
  },
  {
    id: "dg",
    nombre: "DG Aviation",
    sitio: "https://www.dg-aviation.de/en/",
    // Fabricante de planeadores: novedades, boletines técnicos (TM) y AD de la flota DG/LS.
    url: "https://www.dg-aviation.de/en/feed",
    formato: "rss",
    categoria: "Vuelo a vela",
    idioma: "en",
  },
  {
    id: "easa",
    nombre: "EASA",
    sitio: "https://www.easa.europa.eu/en/newsroom-and-events/news",
    url: "https://www.easa.europa.eu/en/newsroom-and-events/news/rss.xml",
    formato: "rss",
    categoria: "Internacional",
    idioma: "en",
  },
  {
    id: "aopa",
    nombre: "AOPA",
    sitio: "https://www.aopa.org/news-and-media/all-news",
    url: "https://www.aopa.org/news-and-media/all-news/rss",
    formato: "rss",
    categoria: "Internacional",
    idioma: "en",
  },
];

/** Notas de vuelo a vela que aparecen en fuentes generales se reclasifican a "Vuelo a vela". */
const RE_VUELO_A_VELA = /vuelo a vela|planeador|velero|\bgliding\b|\bglider|\bsoaring\b|\bsailplane/i;

// ---------------------------------------------------------------------------------------------
// Parser liviano de RSS 2.0 / Atom (con expresiones regulares: los feeds de arriba son simples).

const ENTIDADES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»", iexcl: "¡", iquest: "¿",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", uuml: "ü",
  Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ", Uuml: "Ü",
  ccedil: "ç", deg: "°", ordm: "º", ordf: "ª", euro: "€", copy: "©", reg: "®", trade: "™", middot: "·",
};

function decodificarEntidades(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (todo, e: string) => {
    if (e[0] === "#") {
      const cod = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1));
      return Number.isFinite(cod) && cod > 0 && cod < 0x110000 ? String.fromCodePoint(cod) : "";
    }
    return ENTIDADES[e] ?? todo;
  });
}

function sinCdata(texto: string): string {
  return texto.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

/** Contenido de la primera etiqueta `nombre` (con o sin atributos), sin CDATA. */
function etiqueta(xml: string, nombre: string): string | null {
  const m = xml.match(new RegExp(`<${nombre}(?:\\s[^>]*)?>([\\s\\S]*?)</${nombre}>`, "i"));
  return m ? sinCdata(m[1]) : null;
}

function atributo(tag: string, nombre: string): string | null {
  const m = tag.match(new RegExp(`\\s${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return m ? decodificarEntidades(m[1] ?? m[2] ?? "") : null;
}

/** HTML (escapado o no) → texto plano de una línea. */
function textoPlano(html: string): string {
  let t = sinCdata(html);
  // Los feeds suelen traer el HTML escapado (&lt;p&gt;): primero lo desescapamos.
  if (/&lt;[a-z/!]/i.test(t)) t = decodificarEntidades(t);
  t = t
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  // Algunos feeds escapan dos veces (&amp;nbsp;): desescapamos hasta que no cambie.
  for (let i = 0; i < 3; i++) {
    const d = decodificarEntidades(t);
    if (d === t) break;
    t = d;
  }
  return t.replace(/\s+/g, " ").trim();
}

/** Saca el relleno típico de los feeds (WordPress "The post … appeared first on …", "Read more", etc.). */
function limpiarResumen(resumen: string, titulo: string): string {
  let r = resumen
    .replace(/The post .+? appeared first on .+?\.?\s*$/i, "")
    .replace(/La entrada .+? se publicó primero en .+?\.?\s*$/i, "")
    .replace(/\b(Read More|Leer más|Seguir leyendo|Continue reading)\b\s*(»|→|…)?/gi, "")
    .replace(/\b(View translations|Related Content)\b/gi, "")
    .replace(/\.\.\.$/, "…")
    .replace(/\s+/g, " ")
    .trim();
  if (r.toLowerCase().startsWith(titulo.toLowerCase())) r = r.slice(titulo.length).trim();
  return r.length < 25 ? "" : r;
}

function recortar(texto: string, largo = LARGO_RESUMEN): string {
  if (texto.length <= largo) return texto;
  const corte = texto.slice(0, largo);
  const espacio = corte.lastIndexOf(" ");
  return `${(espacio > largo * 0.6 ? corte.slice(0, espacio) : corte).replace(/[\s.,;:–-]+$/, "")}…`;
}

function urlAbsoluta(url: string | null | undefined, base: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(decodificarEntidades(url.trim()), base);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Saca los parámetros de seguimiento (utm_*) que algunos feeds agregan a los enlaces. */
function limpiarEnlace(url: string): string {
  try {
    const u = new URL(url);
    for (const k of [...u.searchParams.keys()]) if (/^=?utm_/i.test(k) || k === "") u.searchParams.delete(k);
    // AOPA usa "?=utm_source=...": queda una clave vacía rara; la sacamos.
    if (/^\?=/.test(u.search)) u.search = "";
    return u.toString();
  } catch {
    return url;
  }
}

function fechaDesde(texto: string | null): number | null {
  if (!texto) return null;
  const ms = Date.parse(texto.trim().replace(" ", "T"));
  if (!Number.isNaN(ms)) return ms;
  const ms2 = Date.parse(texto.trim());
  return Number.isNaN(ms2) ? null : ms2;
}

function imagenDeItem(item: string, base: string): string | null {
  for (const re of [
    /<media:content\b[^>]*>/gi,
    /<media:thumbnail\b[^>]*>/gi,
    /<enclosure\b[^>]*>/gi,
  ]) {
    for (const m of item.matchAll(re)) {
      const tipo = atributo(m[0], "type") ?? atributo(m[0], "medium") ?? "";
      const url = atributo(m[0], "url");
      if (url && (tipo === "" || /image/i.test(tipo))) return urlAbsoluta(url, base);
    }
  }
  // Si no hay enclosure, la primera <img> del contenido (escapado o no).
  const contenido = sinCdata(etiqueta(item, "content:encoded") ?? etiqueta(item, "description") ?? etiqueta(item, "content") ?? "");
  const html = /&lt;img/i.test(contenido) ? decodificarEntidades(contenido) : contenido;
  const img = html.match(/<img\b[^>]*>/i);
  return img ? urlAbsoluta(atributo(img[0], "src"), base) : null;
}

type ItemCrudo = { titulo: string; enlace: string; fecha: number | null; resumen: string; imagen: string | null };

function leerRssOAtom(xml: string, base: string): ItemCrudo[] {
  const esAtom = !/<item[\s>]/i.test(xml) && /<entry[\s>]/i.test(xml);
  const bloques = [...xml.matchAll(esAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi)].map((m) => m[0]);
  return bloques.flatMap((item) => {
    const titulo = textoPlano(etiqueta(item, "title") ?? "");
    let enlace: string | null;
    if (esAtom) {
      const links = [...item.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
      const alterno = links.find((l) => (atributo(l, "rel") ?? "alternate") === "alternate") ?? links[0];
      enlace = urlAbsoluta(alterno ? atributo(alterno, "href") : null, base);
    } else {
      enlace = urlAbsoluta(textoPlano(etiqueta(item, "link") ?? "") || textoPlano(etiqueta(item, "guid") ?? ""), base);
    }
    if (!titulo || !enlace) return [];
    const fecha = fechaDesde(
      etiqueta(item, "pubDate") ?? etiqueta(item, "dc:date") ?? etiqueta(item, "published") ?? etiqueta(item, "updated"),
    );
    // Preferimos la bajada (description/summary); si no, el comienzo del contenido.
    const crudo = etiqueta(item, "description") ?? etiqueta(item, "summary") ?? etiqueta(item, "content:encoded") ?? etiqueta(item, "content") ?? "";
    let resumen = limpiarResumen(textoPlano(crudo), titulo);
    if (!resumen) resumen = limpiarResumen(textoPlano(etiqueta(item, "content:encoded") ?? ""), titulo);
    return [{ titulo, enlace: limpiarEnlace(enlace), fecha, resumen: recortar(resumen), imagen: imagenDeItem(item, base) }];
  });
}

/** Listado de noticias de un organismo en argentina.gob.ar (tarjetas con <time>, <h3> y bajada). */
function leerListadoArgentinaGobAr(html: string, base: string): ItemCrudo[] {
  const tarjetas = [...html.matchAll(/<a href="(\/noticias\/[^"]+)" class="panel[^"]*">([\s\S]*?)<\/a>/g)];
  return tarjetas.flatMap(([, ruta, cuerpo]) => {
    const titulo = textoPlano(etiqueta(cuerpo, "h3") ?? "");
    const enlace = urlAbsoluta(ruta, base);
    if (!titulo || !enlace) return [];
    const fechaAttr = cuerpo.match(/<time datetime=['"]([^'"]+)['"]/)?.[1] ?? null;
    // El portal publica la hora local argentina sin zona: la marcamos como UTC−3.
    const fecha = fechaDesde(fechaAttr ? `${fechaAttr.replace(" ", "T")}-03:00` : null);
    const bajada = cuerpo.match(/<p class="text-muted">([\s\S]*?)<\/p>\s*<\/div>/)?.[1] ?? "";
    const imagen = urlAbsoluta(cuerpo.match(/background-image:url\(([^)]+)\)/)?.[1], base);
    return [{ titulo, enlace, fecha, resumen: recortar(limpiarResumen(textoPlano(bajada), titulo)), imagen }];
  });
}

// ---------------------------------------------------------------------------------------------

async function pedirTexto(url: string): Promise<{ ok: true; texto: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return { ok: false, error: `respondió ${res.status}` };
    return { ok: true, texto: await res.text() };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return { ok: false, error: /abort|timeout/i.test(msg) ? "no respondió a tiempo" : "error de red" };
  }
}

/** Novedades de una sola fuente (por id de `FUENTES_NOVEDADES`). Cache de horas. */
export async function obtenerNovedadesDeFuente(id: string): Promise<Resultado<Novedad[]>> {
  "use cache";
  cacheLife("hours");

  const fuente = FUENTES_NOVEDADES.find((f) => f.id === id);
  if (!fuente) return { ok: false, error: `Fuente desconocida: ${id}` };

  const res = await pedirTexto(fuente.url);
  if (!res.ok) return { ok: false, error: `${fuente.nombre} ${res.error}` };

  let crudos: ItemCrudo[];
  try {
    crudos =
      fuente.formato === "rss" ? leerRssOAtom(res.texto, fuente.url) : leerListadoArgentinaGobAr(res.texto, fuente.url);
  } catch {
    return { ok: false, error: `No se pudo leer el feed de ${fuente.nombre}` };
  }
  if (crudos.length === 0) return { ok: false, error: `${fuente.nombre} no devolvió noticias legibles` };

  const vistos = new Set<string>();
  const datos = crudos
    .filter((c) => (fuente.incluir ? fuente.incluir(c) : true))
    .filter((c) => (vistos.has(c.enlace) ? false : (vistos.add(c.enlace), true)))
    .slice(0, MAX_POR_FUENTE)
    .map<Novedad>((c) => ({
      ...c,
      fechaTexto: c.fecha != null ? FORMATO_FECHA.format(c.fecha) : null,
      fuente: fuente.nombre,
      fuenteId: fuente.id,
      idioma: fuente.idioma,
      categoria:
        fuente.categoria === "Aviación general" && RE_VUELO_A_VELA.test(`${c.titulo} ${c.resumen}`)
          ? "Vuelo a vela"
          : fuente.categoria,
    }));
  return { ok: true, datos };
}

function ordenarPorFecha(a: Novedad, b: Novedad): number {
  return (b.fecha ?? 0) - (a.fecha ?? 0) || a.titulo.localeCompare(b.titulo);
}

/** Todas las fuentes juntas, ordenadas por fecha (más nuevas primero), con el estado de cada fuente. */
export async function obtenerNovedades(): Promise<NovedadesAgregadas> {
  const resultados = await Promise.all(FUENTES_NOVEDADES.map((f) => obtenerNovedadesDeFuente(f.id)));
  const fuentes: EstadoFuente[] = FUENTES_NOVEDADES.map((f, i) => {
    const r = resultados[i];
    return {
      id: f.id,
      nombre: f.nombre,
      sitio: f.sitio,
      categoria: f.categoria,
      ok: r.ok,
      items: r.ok ? r.datos.length : 0,
      ...(r.ok ? {} : { error: r.error }),
    };
  });
  const novedades = resultados.flatMap((r) => (r.ok ? r.datos : [])).sort(ordenarPorFecha);
  return { novedades, fuentes };
}

/**
 * Las últimas `n` novedades de todas las fuentes (para la portada). Si fallan todas las fuentes
 * devuelve `{ok:false}`; si falla alguna, devuelve lo que haya.
 */
export async function obtenerUltimasNovedades(
  n: number,
  opciones: { categoria?: CategoriaNovedad; soloEnEspanol?: boolean } = {},
): Promise<Resultado<Novedad[]>> {
  const { novedades, fuentes } = await obtenerNovedades();
  if (fuentes.every((f) => !f.ok)) return { ok: false, error: "No respondió ninguna fuente de noticias" };
  const filtradas = novedades.filter(
    (x) => (!opciones.categoria || x.categoria === opciones.categoria) && (!opciones.soloEnEspanol || x.idioma === "es"),
  );
  return { ok: true, datos: filtradas.slice(0, Math.max(0, Math.floor(n))) };
}

// ---------------------------------------------------------------------------------------------
// Fuentes probadas y descartadas (nov. 2026):
// - FAVAV (favav.com.ar): sitio ASP.NET sin RSS ni API.
// - Club de Planeadores Buenos Aires, aeroclubes con blog (cpba.org.ar, planeadores.org.ar, etc.): no resuelven DNS o sin feed.
// - FAI / IGC (fai.org, igc.fai.org, igcgliding.org): fai.org devuelve 403 a clientes automáticos; igc.fai.org no resuelve.
// - WeGlide: 403; OLC (onlinecontest.org): sin RSS (404). SoaringSpot: sin feed.
// - SSA (ssa.org): 403. Soaring Café, Gliding Magazine: no responden o certificado inválido.
// - British Gliding Association (gliding.co.uk/feed): responde, pero sin publicaciones desde enero de 2025.
// - argentina.gob.ar/rss.xml: es un feed genérico del portal (personas buscadas), no de la ANAC.
// - EANA en argentina.gob.ar: no existe; EANA publica en eana.com.ar (usado).
// - FAA press releases: responde, pero casi todo es política aerocomercial de EE. UU.
// - OACI (icao.int): sin RSS (404).
// - Aviación News, Aviación al Día: responden, pero son casi solo aerolíneas y rutas comerciales.
