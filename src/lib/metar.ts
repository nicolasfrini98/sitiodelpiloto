// Utilidades para presentar un METAR de forma legible. Todo cálculo es
// aproximado y orientativo: no reemplaza la información oficial (SMN / EANA).
import type { Metar } from "./aviationweather";

export const ZONA_AR = "America/Argentina/Buenos_Aires";

export const CATEGORIAS = {
  VFR: { clase: "bg-emerald-600 text-white", desc: "Techo > 3000 ft y visibilidad > 8 km" },
  MVFR: { clase: "bg-sky-600 text-white", desc: "Techo 1000–3000 ft o visibilidad 5–8 km" },
  IFR: { clase: "bg-red-600 text-white", desc: "Techo 500–1000 ft o visibilidad 1,6–5 km" },
  LIFR: { clase: "bg-fuchsia-700 text-white", desc: "Techo < 500 ft o visibilidad < 1,6 km" },
} as const;

export type Categoria = keyof typeof CATEGORIAS;

export const NUBES: Record<string, string> = {
  SKC: "Cielo despejado",
  CLR: "Cielo despejado",
  NSC: "Sin nubes significativas",
  NCD: "Sin nubes detectadas",
  CAVOK: "CAVOK",
  FEW: "Escasas (1-2/8)",
  SCT: "Dispersas (3-4/8)",
  BKN: "Fragmentadas (5-7/8)",
  OVC: "Cubierto (8/8)",
  OVX: "Cielo invisible",
};

export function horaZulu(epoch: number): string {
  const d = new Date(epoch * 1000);
  return `${String(d.getUTCDate()).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}Z`;
}

export function horaLocal(epoch: number): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_AR,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(epoch * 1000));
}

export function viento(m: Metar): string {
  if (m.wspd == null) return "—";
  if (m.wspd === 0) return "Calma";
  const dir = m.wdir === "VRB" ? "Variable" : `${String(m.wdir).padStart(3, "0")}°`;
  const rafaga = m.wgst ? ` G${m.wgst}` : "";
  return `${dir} ${m.wspd}${rafaga} kt`;
}

/** Visibilidad leyendo el METAR crudo (en Argentina se reporta en metros). */
export function visibilidad(m: Metar): string {
  const tokens = m.rawOb.split(/\s+/);
  if (tokens.includes("CAVOK")) return "≥ 10 km";
  const vis = tokens.slice(2).find((t) => /^\d{4}(NDV)?$/.test(t));
  if (vis) {
    const metros = parseInt(vis, 10);
    if (metros >= 9999) return "≥ 10 km";
    return metros >= 5000 ? `${metros / 1000} km` : `${metros} m`;
  }
  if (m.visib == null) return "—";
  if (typeof m.visib === "string" && m.visib.endsWith("+")) return "≥ 10 km";
  const km = Number(m.visib) * 1.609;
  return Number.isFinite(km) ? `${km.toFixed(1)} km` : String(m.visib);
}

export function capas(m: Metar): string {
  if (m.rawOb.includes("CAVOK")) return "CAVOK";
  if (!m.clouds?.length) return m.cover ? (NUBES[m.cover] ?? m.cover) : "—";
  return m.clouds
    .map((c) => `${c.cover}${c.base != null ? ` ${c.base.toLocaleString("es-AR")} ft` : ""}${c.type ? ` ${c.type}` : ""}`)
    .join(" · ");
}

/** Humedad relativa (%) con la fórmula de Magnus. */
export function humedadRelativa(t: number, td: number): number {
  const a = 17.625;
  const b = 243.04;
  return Math.round(100 * Math.exp((a * td) / (b + td) - (a * t) / (b + t)));
}

/** Altitud de densidad aproximada, en pies. */
export function altitudDensidad(m: Metar): number | null {
  if (m.temp == null || m.altim == null) return null;
  const elevFt = m.elev * 3.28084;
  const altPresion = elevFt + (1013.25 - m.altim) * 30;
  const isa = 15 - (2 * altPresion) / 1000;
  return Math.round(altPresion + 120 * (m.temp - isa));
}

/** Base estimada de cúmulos sobre el terreno (ft AGL): (T - Td) × 400. Útil para vuelo a vela. */
export function baseCumulos(m: Metar): number | null {
  if (m.temp == null || m.dewp == null) return null;
  return Math.max(0, Math.round(((m.temp - m.dewp) * 400) / 100) * 100);
}

export function numero(n: number): string {
  return n.toLocaleString("es-AR");
}

/** "25/11 21:00" en hora local argentina. */
export function fechaHoraLocal(epoch: number): string {
  const p = new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_AR,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(epoch * 1000));
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${v("day")}/${v("month")} ${v("hour")}:${v("minute")}`;
}
