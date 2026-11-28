"use client";

import { useEffect, useState } from "react";

/** Marca si un NOTAM está vigente o todavía no empezó. Se calcula en el navegador (la página está cacheada). */
export function VigenciaNotam({ desde, hasta }: { desde: string | null; hasta: string | null }) {
  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setAhora(Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  if (ahora == null) return null;

  const ini = desde ? Date.parse(desde) : null;
  const fin = hasta ? Date.parse(hasta) : null;
  if (fin != null && fin < ahora)
    return <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">Vencido</span>;
  if (ini != null && ini > ahora) {
    const horas = Math.round((ini - ahora) / 3_600_000);
    const cuando = horas < 48 ? `en ${horas} h` : `en ${Math.round(horas / 24)} días`;
    return <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-xs text-sky-300">Empieza {cuando}</span>;
  }
  return <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-xs font-semibold text-ambar">Vigente</span>;
}
