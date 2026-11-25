"use client";

import dynamic from "next/dynamic";
import type { NivelAlerta } from "@/lib/smn";

export type DatosMapa = {
  metars: {
    icao: string;
    nombre: string;
    lat: number;
    lon: number;
    cat: string | null;
    raw: string | null;
  }[];
  sigmets: {
    id: string;
    firId: string;
    seriesId: string;
    fenomeno: string;
    coords: [number, number][];
    raw: string;
  }[];
  alertas: { evento: string; nivel: NivelAlerta; poligonos: [number, number][][] }[];
  radar: { plantilla: string; hora: number } | null;
};

// Leaflet usa `window`: lo cargamos solo en el navegador.
const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-sm text-slate-400">
      Cargando mapa…
    </div>
  ),
});

export function MapaMeteorologico(props: DatosMapa) {
  return <MapaLeaflet {...props} />;
}
