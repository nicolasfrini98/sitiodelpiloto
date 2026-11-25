import type { Metadata } from "next";
import { Proximamente } from "@/components/Proximamente";

export const metadata: Metadata = { title: "Meteorología" };

export default function Page() {
  return (
    <Proximamente
      titulo="Meteorología en tiempo real"
      intro="Todo lo necesario para planificar un vuelo, con foco en el vuelo a vela: térmicas, bases de nubes y viento en altura."
      planes={[
        "Mapa de METAR con categoría de vuelo por aeródromo.",
        "Imágenes satelitales (GOES-19) y radares del SMN.",
        "Pronósticos de térmicas y techo de convección (sondeos, índices de inestabilidad).",
        "Viento en altura, SIGMET y AIRMET para la FIR Argentina.",
      ]}
    />
  );
}
