"use client";

import { useEffect, useState } from "react";

/** "hace 12 min" calculado en el navegador, para no fijar la hora en el HTML cacheado. */
export function Hace({ epoch }: { epoch: number }) {
  const [ahora, setAhora] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setAhora(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (ahora == null) return null;
  const minutos = Math.max(0, Math.round((ahora - epoch * 1000) / 60_000));
  const texto = minutos < 60 ? `hace ${minutos} min` : `hace ${Math.floor(minutos / 60)} h ${minutos % 60} min`;
  const viejo = minutos > 90;
  return <span className={viejo ? "text-amber-400" : "text-slate-400"}>{texto}</span>;
}
