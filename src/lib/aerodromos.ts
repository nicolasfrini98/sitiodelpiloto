import lista from "@/data/aerodromos.json";

export type Aerodromo = {
  icao: string;
  iata: string | null;
  nombre: string;
  provincia: string | null;
  lat: number;
  lon: number;
  elevacionM: number;
  tieneTaf: boolean;
};

export const aerodromos: Aerodromo[] = lista;

/** Códigos ISO 3166-2:AR que usa aviationweather.gov en el campo "state". */
export const PROVINCIAS: Record<string, string> = {
  A: "Salta",
  B: "Buenos Aires",
  C: "CABA",
  D: "San Luis",
  E: "Entre Ríos",
  F: "La Rioja",
  G: "Santiago del Estero",
  H: "Chaco",
  J: "San Juan",
  K: "Catamarca",
  L: "La Pampa",
  M: "Mendoza",
  N: "Misiones",
  P: "Formosa",
  Q: "Neuquén",
  R: "Río Negro",
  S: "Santa Fe",
  T: "Tucumán",
  U: "Chubut",
  V: "Tierra del Fuego",
  W: "Corrientes",
  X: "Córdoba",
  Y: "Jujuy",
  Z: "Santa Cruz",
};

export function nombreProvincia(codigo: string | null): string {
  return (codigo && PROVINCIAS[codigo]) || "—";
}

export function buscarAerodromo(icao: string): Aerodromo | undefined {
  const codigo = icao.toUpperCase();
  return aerodromos.find((a) => a.icao === codigo);
}

/** Aeródromos que mostramos en la portada. */
export const DESTACADOS = ["SABE", "SAEZ", "SADF", "SACO", "SAME", "SAZS"];
