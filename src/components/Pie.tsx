export function Pie() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-xs text-slate-400">
        <p>
          <strong className="text-slate-300">Uso informativo.</strong> Los datos meteorológicos provienen de fuentes
          públicas (aviationweather.gov / NOAA, que redistribuye los reportes del SMN) y pueden tener demoras o errores.
          No reemplazan la información oficial de EANA, el SMN ni la ANAC para la planificación de un vuelo.
        </p>
        <p>Horas en UTC (Z) y hora oficial argentina (UTC−3).</p>
      </div>
    </footer>
  );
}
