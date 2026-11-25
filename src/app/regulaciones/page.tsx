import type { Metadata } from "next";
import { Proximamente } from "@/components/Proximamente";

export const metadata: Metadata = { title: "Regulaciones" };

export default function Page() {
  return (
    <Proximamente
      titulo="Informe de regulaciones ANAC"
      intro="Un informe que se actualiza cuando la ANAC publica cambios en las RAAC y otras normas que afectan a pilotos."
      planes={[
        "Seguimiento automático de las publicaciones de la ANAC y del Boletín Oficial.",
        "Resumen en lenguaje claro de qué cambió y a quién afecta.",
        "Historial de cambios con enlace al texto oficial.",
      ]}
    />
  );
}
