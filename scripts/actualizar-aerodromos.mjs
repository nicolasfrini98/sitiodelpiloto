// Regenera src/data/aerodromos.json con las estaciones argentinas que publican
// METAR/TAF según aviationweather.gov. Uso: npm run aerodromos
import { writeFile } from "node:fs/promises";

const BBOX = "-56,-74,-21,-53"; // lat_min,lon_min,lat_max,lon_max (Argentina continental + Tierra del Fuego)
const url = `https://aviationweather.gov/api/data/stationinfo?bbox=${BBOX}&format=json`;

const res = await fetch(url, { headers: { "User-Agent": "sitiodelpiloto/0.1" } });
if (!res.ok) throw new Error(`aviationweather respondió ${res.status}`);
const estaciones = await res.json();

const aerodromos = estaciones
  .filter((e) => e.country === "AR" && e.icaoId)
  .map((e) => ({
    icao: e.icaoId,
    iata: e.iataId ?? null,
    nombre: e.site,
    provincia: e.state ?? null,
    lat: e.lat,
    lon: e.lon,
    elevacionM: e.elev,
    tieneTaf: Array.isArray(e.siteType) && e.siteType.includes("TAF"),
  }))
  .sort((a, b) => a.icao.localeCompare(b.icao));

await writeFile(
  new URL("../src/data/aerodromos.json", import.meta.url),
  JSON.stringify(aerodromos, null, 2) + "\n",
);
console.log(`Guardados ${aerodromos.length} aerodromos argentinos.`);
