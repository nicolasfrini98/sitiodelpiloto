"use client";

import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { CircleMarker, MapContainer, Polygon, Popup, TileLayer, Tooltip } from "react-leaflet";
import type { DatosMapa } from "./MapaMeteorologico";

const COLOR_CATEGORIA: Record<string, string> = {
  VFR: "#059669",
  MVFR: "#0284c7",
  IFR: "#dc2626",
  LIFR: "#a21caf",
};
const SIN_DATO = "#64748b";

const COLOR_ALERTA = { amarilla: "#facc15", naranja: "#fb923c", roja: "#ef4444" } as const;

function horaZ(epoch: number): string {
  const d = new Date(epoch * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}Z`;
}

export default function MapaLeaflet({ metars, sigmets, alertas, radar }: DatosMapa) {
  const [verMetar, setVerMetar] = useState(true);
  const [verSigmet, setVerSigmet] = useState(true);
  const [verAlertas, setVerAlertas] = useState(false);
  const [verRadar, setVerRadar] = useState(false);

  const capas = [
    { etiqueta: "METAR", activo: verMetar, cambiar: setVerMetar, disponible: true },
    { etiqueta: `SIGMET (${sigmets.length})`, activo: verSigmet, cambiar: setVerSigmet, disponible: true },
    { etiqueta: `Alertas SMN (${alertas.length})`, activo: verAlertas, cambiar: setVerAlertas, disponible: true },
    {
      etiqueta: radar ? `Radar (${horaZ(radar.hora)})` : "Radar (sin datos)",
      activo: verRadar,
      cambiar: setVerRadar,
      disponible: radar != null,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-sm">
        {capas.map((c) => (
          <label
            key={c.etiqueta}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 ${
              c.activo ? "border-sky-500/60 bg-sky-500/10 text-sky-200" : "border-white/10 text-slate-300"
            } ${c.disponible ? "" : "cursor-not-allowed opacity-50"}`}
          >
            <input
              type="checkbox"
              className="accent-sky-500"
              checked={c.activo}
              disabled={!c.disponible}
              onChange={(e) => c.cambiar(e.target.checked)}
            />
            {c.etiqueta}
          </label>
        ))}
      </div>

      <MapContainer
        center={[-38.5, -63.5]}
        zoom={4}
        minZoom={3}
        scrollWheelZoom={false}
        className="h-[520px] w-full rounded-xl border border-white/10"
        style={{ background: "#0f172a" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          // Las teselas de OSM son claras: las oscurecemos con un filtro CSS (ver globals.css).
          className="teselas-oscuras"
        />

        {verRadar && radar && (
          <TileLayer
            key={radar.plantilla}
            url={radar.plantilla}
            opacity={0.7}
            maxNativeZoom={7}
            maxZoom={19}
            zIndex={10}
            attribution='Radar: <a href="https://www.rainviewer.com/api.html">RainViewer</a>'
          />
        )}

        {verAlertas &&
          alertas.map((a, i) =>
            a.poligonos.map((p, j) => (
              <Polygon
                key={`a-${i}-${j}`}
                positions={p}
                pathOptions={{ color: COLOR_ALERTA[a.nivel], weight: 1, fillOpacity: 0.25 }}
              >
                <Tooltip sticky>
                  Alerta {a.nivel} por {a.evento.toLowerCase()}
                </Tooltip>
              </Polygon>
            )),
          )}

        {verSigmet &&
          sigmets.map((s) =>
            s.coords.length > 2 ? (
              <Polygon
                key={s.id}
                positions={s.coords}
                pathOptions={{ color: "#f59e0b", weight: 2, dashArray: "6 4", fillOpacity: 0.12 }}
              >
                <Popup maxWidth={360}>
                  <p className="font-semibold">
                    {s.firId} SIGMET {s.seriesId} · {s.fenomeno}
                  </p>
                  <pre className="mt-1 text-[11px] whitespace-pre-wrap">{s.raw}</pre>
                </Popup>
              </Polygon>
            ) : null,
          )}

        {verMetar &&
          metars.map((m) => (
            <CircleMarker
              key={m.icao}
              center={[m.lat, m.lon]}
              radius={m.raw ? 7 : 4}
              pathOptions={{
                color: "#0f172a",
                weight: 1,
                fillColor: (m.cat && COLOR_CATEGORIA[m.cat]) || SIN_DATO,
                fillOpacity: m.raw ? 0.95 : 0.6,
              }}
            >
              <Popup maxWidth={340}>
                <p className="font-semibold">
                  {m.icao} · {m.nombre} {m.cat ? `· ${m.cat}` : ""}
                </p>
                {m.raw ? (
                  <pre className="mt-1 font-mono text-[11px] whitespace-pre-wrap">{m.raw}</pre>
                ) : (
                  <p className="mt-1 text-xs">Sin METAR en las últimas 3 horas.</p>
                )}
                <a href={`/metar/${m.icao}`}>Ver ficha →</a>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        {Object.entries(COLOR_CATEGORIA).map(([cat, color]) => (
          <span key={cat} className="flex items-center gap-1">
            <span className="inline-block size-3 rounded-full" style={{ background: color }} /> {cat}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="inline-block size-3 rounded-full" style={{ background: SIN_DATO }} /> Sin reporte
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed border-amber-500" /> SIGMET
        </span>
        {Object.entries(COLOR_ALERTA).map(([nivel, color]) => (
          <span key={nivel} className="flex items-center gap-1">
            <span className="inline-block size-3 rounded-sm opacity-70" style={{ background: color }} /> Alerta {nivel}
          </span>
        ))}
      </div>
    </div>
  );
}
