// Frecuencias ATS (AD 2.18) y radioayudas (AD 2.19) de los aeródromos que están en el AIP Argentina.
// Los datos se extraen de los PDF oficiales con scripts/frecuencias_aip.py (ver CLAUDE.md) y se guardan
// en src/data/frecuencias-aip.json. Para el resto de los aeródromos se usa el MADHEL (src/lib/anac-ais.ts).
import datos from "@/data/frecuencias-aip.json";

export type FrecuenciaAts = {
  servicio: string;
  distintivo: string;
  canal: string;
  frecuencia: string;
  horario: string;
  observaciones: string;
};

export type Radioayuda = {
  tipo: string;
  id: string;
  frecuencia: string;
  horario: string;
  observaciones: string;
};

export type FrecuenciasAip = {
  documento: string;
  url: string;
  airac: string | null;
  ats: FrecuenciaAts[];
  radioayudas: Radioayuda[];
};

const AERODROMOS = datos.aerodromos as Record<string, FrecuenciasAip>;

/** Fecha en que se extrajeron los datos del AIP (AAAA-MM-DD). */
export const EXTRACCION_AIP: string = datos.extraido;

export function frecuenciasAip(icao: string): FrecuenciasAip | null {
  return AERODROMOS[icao.toUpperCase()] ?? null;
}

/** Nombre corto en castellano del servicio ATS. */
export function nombreServicio(s: string): string {
  const partes = s.replace(/\s+/g, "").split("/");
  const NOMBRES: Record<string, string> = {
    TWR: "Torre",
    APP: "Aproximación",
    TMA: "TMA",
    SMC: "Superficie",
    GND: "Superficie",
    CLRD: "Autorizaciones",
    ATIS: "ATIS",
    DIF: "Difusión",
    EMERG: "Emergencia",
    AFIS: "AFIS",
  };
  return partes.map((p) => NOMBRES[p] ?? p).join(" / ");
}
