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

/** Hora UTC (Z) y hora oficial argentina, calculadas en el navegador. */
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
      className={`flex items-center gap-2 font-mono text-xs leading-none tabular-nums ${className}`}
      aria-label={ahora ? `Hora UTC ${utc}, hora local de Argentina ${local}` : "Reloj"}
      role="timer"
    >
      <span className="rounded border border-sky-400/40 bg-black/40 px-1.5 py-1 text-sky-300">
        {utc}
        <span className="text-sky-500">Z</span>
      </span>
      <span className="rounded border border-amber-300/40 bg-black/40 px-1.5 py-1 text-amber-300">
        {local}
        <span className="ml-1 text-[10px] text-amber-500">ARG</span>
      </span>
    </div>
  );
}
