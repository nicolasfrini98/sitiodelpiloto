"use client";

import { useEffect, useState } from "react";
import { ZONA_AR } from "@/lib/metar";

const formatoLocal = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_AR,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function dos(n: number) {
  return String(n).padStart(2, "0");
}

/** Hora UTC (Z) y hora oficial argentina, calculadas en el navegador. Estilo de display de cabina. */
export function Reloj({ className = "" }: { className?: string }) {
  const [ahora, setAhora] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setAhora(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const utc = ahora ? `${dos(ahora.getUTCHours())}:${dos(ahora.getUTCMinutes())}` : "--:--";
  const local = ahora ? formatoLocal.format(ahora) : "--:--";

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded border border-slate-700 bg-black font-mono text-[13px] leading-none tabular-nums ${className}`}
      aria-label={ahora ? `Hora UTC ${utc}, hora local de Argentina ${local}` : "Reloj"}
      role="timer"
    >
      <span className="flex items-center gap-1 px-1.5 py-1.5 text-cielo sm:px-2">
        {utc}
        <span className="text-[10px] text-sky-300/70">Z</span>
      </span>
      <span className="flex items-center gap-1 border-l border-slate-700 px-1.5 py-1.5 text-ambar sm:px-2">
        {local}
        <span className="text-[10px] text-amber-300/70">ARG</span>
      </span>
    </div>
  );
}
