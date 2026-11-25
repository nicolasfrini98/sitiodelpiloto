import type { Metadata } from "next";
import { Proximamente } from "@/components/Proximamente";

export const metadata: Metadata = { title: "Estudio" };

export default function Page() {
  return (
    <Proximamente
      titulo="Estudio para licencias ANAC"
      intro="Preguntas y respuestas para preparar los exámenes teóricos, organizadas por tipo de licencia según el material publicado por la ANAC."
      planes={[
        "Bancos de preguntas por licencia: Piloto de Planeador, Piloto Privado, Piloto Comercial, entre otras.",
        "Modo práctica (con explicación) y modo examen (cronometrado).",
        "Referencia a la RAAC o al documento ANAC de donde sale cada respuesta.",
      ]}
    />
  );
}
