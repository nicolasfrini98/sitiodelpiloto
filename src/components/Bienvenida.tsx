"use client";

import { useEffect, useState } from "react";
import { ALIAS_APORTE, TITULAR_APORTE } from "@/lib/aporte";
import { AvatarPiloto } from "./AvatarPiloto";

const CLAVE = "sitiodelpiloto:bienvenida-vista";

/**
 * Saludo del autor: una tarjeta que entra desde el costado la primera vez que alguien visita el sitio.
 * No bloquea la página; se cierra con la X o con "Entrar al sitio" y no vuelve a aparecer.
 */
export function Bienvenida() {
  const [montada, setMontada] = useState(false);
  const [visible, setVisible] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vista = false;
    try {
      vista = localStorage.getItem(CLAVE) === "1";
    } catch {}
    if (vista) return;
    const t1 = setTimeout(() => setMontada(true), 1200);
    const t2 = setTimeout(() => setVisible(true), 1250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const alEscape = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", alEscape);
    return () => window.removeEventListener("keydown", alEscape);
  }, [visible]);

  function cerrar() {
    try {
      localStorage.setItem(CLAVE, "1");
    } catch {}
    setVisible(false);
    setTimeout(() => setMontada(false), 400);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(ALIAS_APORTE);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  }

  if (!montada) return null;

  return (
    <aside
      role="complementary"
      aria-labelledby="bienvenida-titulo"
      className={`fixed right-3 bottom-3 left-3 z-[1200] overflow-hidden rounded-2xl border border-amber-300/40 bg-slate-900/95 text-slate-200 shadow-2xl backdrop-blur transition-all duration-500 ease-out sm:left-auto sm:w-[22rem] ${
        visible ? "translate-x-0 opacity-100" : "translate-x-[110%] opacity-0"
      }`}
    >
      <div className="franjas-pista" />
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar saludo"
        className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div className="flex gap-3 p-4 pr-10">
        <AvatarPiloto className="h-16 w-16 shrink-0" />
        <div className="space-y-1">
          <h2 id="bienvenida-titulo" className="text-lg leading-tight font-bold text-white uppercase">
            Bienvenidos a bordo
          </h2>
          <p className="text-sm leading-snug">
            Hola, este sitio ha sido construido con mucho esfuerzo y dedicación. Puedes hacer tu aporte a mi carrera como
            piloto al alias: <strong className="font-mono text-amber-300">{ALIAS_APORTE}</strong> ({TITULAR_APORTE}).
            Muchas gracias
          </p>
        </div>
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <button
          type="button"
          onClick={copiar}
          className="flex-1 rounded-lg bg-amber-400 px-3 py-2 font-display font-semibold tracking-wide text-slate-950 uppercase hover:bg-amber-300"
        >
          {copiado ? "¡Copiado!" : "Copiar alias"}
        </button>
        <button
          type="button"
          onClick={cerrar}
          className="flex-1 rounded-lg border border-white/20 px-3 py-2 font-display font-semibold tracking-wide text-white uppercase hover:border-sky-400 hover:text-sky-300"
        >
          Entrar al sitio
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {copiado ? "Alias copiado al portapapeles" : ""}
      </span>
    </aside>
  );
}
