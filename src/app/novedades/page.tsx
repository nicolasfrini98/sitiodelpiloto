import type { Metadata } from "next";
import { Proximamente } from "@/components/Proximamente";

export const metadata: Metadata = { title: "Novedades" };

export default function Page() {
  return (
    <Proximamente
      titulo="Novedades"
      intro="Noticias para pilotos de planeador y de avión en carrera: campeonatos, eventos de clubes, avisos de la ANAC y de EANA."
      planes={[
        "Feed de noticias de vuelo a vela (FAVAV, clubes, campeonatos argentinos y mundiales).",
        "Novedades de carrera aeronáutica y aviación general.",
        "Avisos oficiales de ANAC y EANA (AIC, cambios de espacio aéreo).",
      ]}
    />
  );
}
