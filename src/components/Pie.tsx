import { ALIAS_APORTE, TITULAR_APORTE } from "@/lib/aporte";
import { Logo } from "./Logo";

export function Pie() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-black/30">
      <div className="franjas-pista" />
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 text-xs text-slate-400">
        <p className="flex items-center gap-2 font-display text-base font-semibold tracking-wider text-slate-300 uppercase">
          <Logo className="h-5 w-5 text-sky-400" /> Sitio del Piloto
        </p>
        <p>
          <strong className="text-slate-300">Uso informativo.</strong> Los datos meteorológicos provienen de fuentes
          públicas (aviationweather.gov / NOAA, que redistribuye los reportes del SMN) y pueden tener demoras o errores.
          No reemplazan la información oficial de EANA, el SMN ni la ANAC para la planificación de un vuelo.
        </p>
        <p>
          Otras fuentes: alertas del SMN (feed CAP, CC BY 4.0), pronósticos de Open-Meteo (CC BY 4.0), radar de
          RainViewer, imágenes GOES-19 de NOAA/NESDIS STAR y mapa base © OpenStreetMap. Fotos de Wikimedia Commons con
          licencia libre; el autor y la licencia figuran junto a cada una.
        </p>
        <p>Horas en UTC (Z) y hora oficial argentina (UTC−3).</p>
        <p className="text-slate-300">
          ¿Te sirve el sitio? Podés apoyar la carrera de piloto de su autor con un aporte al alias{" "}
          <strong className="font-mono text-amber-300">{ALIAS_APORTE}</strong> ({TITULAR_APORTE}). ¡Gracias!
        </p>
      </div>
    </footer>
  );
}
