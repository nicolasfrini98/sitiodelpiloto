"use client";

import { useEffect, useRef, useState } from "react";
import { ALIAS_APORTE, TITULAR_APORTE } from "@/lib/aporte";
import { AvatarPiloto } from "./AvatarPiloto";

const CLAVE = "sitiodelpiloto:bienvenida-vista";

/** Saludo del autor que aparece la primera vez que alguien entra al sitio. */
export function Bienvenida() {
  const [abierta, setAbierta] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let vista = false;
    try {
      vista = localStorage.getItem(CLAVE) === "1";
    } catch {}
    if (vista) return;
    const t = setTimeout(() => setAbierta(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    if (!abierta && d.open) d.close();
  }, [abierta]);

  function cerrar() {
    try {
      localStorage.setItem(CLAVE, "1");
    } catch {}
    setAbierta(false);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(ALIAS_APORTE);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  }

  return (
    <dialog
      ref={dialogo}
      onClose={cerrar}
      onClick={(e) => e.target === e.currentTarget && cerrar()}
      aria-labelledby="bienvenida-titulo"
      className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-amber-300/40 bg-slate-900 p-0 text-slate-200 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="franjas-pista" />
      <div className="flex flex-col items-center gap-4 px-6 pt-6 pb-6 text-center">
        <AvatarPiloto className="h-28 w-28 drop-shadow-lg" />
        <h2 id="bienvenida-titulo" className="text-2xl font-bold text-white uppercase">
          Bienvenidos a bordo
        </h2>
        <p className="text-lg leading-relaxed">
          Hola, este sitio ha sido construido con mucho esfuerzo y dedicación. Puedes hacer tu aporte a mi carrera como
          piloto al alias: <strong className="font-mono text-amber-300">{ALIAS_APORTE}</strong> ({TITULAR_APORTE}).
          Muchas gracias
        </p>
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={copiar}
            className="flex-1 rounded-lg bg-amber-400 px-4 py-2.5 font-display text-lg font-semibold tracking-wide text-slate-950 uppercase hover:bg-amber-300"
          >
            {copiado ? "¡Alias copiado!" : "Copiar alias"}
          </button>
          <button
            type="button"
            onClick={cerrar}
            autoFocus
            className="flex-1 rounded-lg border border-white/20 px-4 py-2.5 font-display text-lg font-semibold tracking-wide text-white uppercase hover:border-sky-400 hover:text-sky-300"
          >
            Entrar al sitio
          </button>
        </div>
        <span className="sr-only" aria-live="polite">
          {copiado ? "Alias copiado al portapapeles" : ""}
        </span>
      </div>
    </dialog>
  );
}
