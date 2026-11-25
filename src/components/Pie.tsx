import Link from "next/link";
import { ALIAS_APORTE, TITULAR_APORTE } from "@/lib/aporte";
import { SECCIONES } from "./Encabezado";
import { Logo } from "./Logo";

export function Pie() {
  return (
    <footer className="mt-24 border-t border-trazo bg-black/40">
      <div className="franjas-pista" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 text-sm text-slate-400 md:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <p className="flex items-center gap-2 font-display text-xl font-bold text-white">
            <Logo className="h-6 w-6 text-cielo" /> Sitio del Piloto
          </p>
          <nav aria-label="Secciones del pie" className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {SECCIONES.map((s) => (
              <Link key={s.href} href={s.href} className="text-slate-300 hover:text-ambar">
                {s.titulo}
              </Link>
            ))}
          </nav>
          <div className="rounded border border-amber-400/30 bg-amber-400/[0.06] p-3 text-slate-300">
            ¿Te sirve el sitio? Podés apoyar la carrera de piloto de su autor con un aporte al alias{" "}
            <strong className="font-mono text-ambar">{ALIAS_APORTE}</strong> ({TITULAR_APORTE}). ¡Gracias!
          </div>
        </div>
        <div className="max-w-[72ch] space-y-3 text-xs leading-relaxed">
          <p>
            <strong className="text-slate-200">Uso informativo.</strong> Los datos meteorológicos provienen de fuentes
            públicas (aviationweather.gov / NOAA, que redistribuye los reportes del SMN) y pueden tener demoras o errores.
            No reemplazan la información oficial de EANA, el SMN ni la ANAC para la planificación de un vuelo.
          </p>
          <p>
            Otras fuentes: alertas del SMN (feed CAP, CC BY 4.0), pronósticos de Open-Meteo (CC BY 4.0), radar de
            RainViewer, imágenes GOES-19 de NOAA/NESDIS STAR y mapa base © OpenStreetMap. Fotos de Wikimedia Commons con
            licencia libre; el autor y la licencia figuran junto a cada una.
          </p>
          <p>Horas en UTC (Z) y hora oficial argentina (UTC−3).</p>
        </div>
      </div>
    </footer>
  );
}
