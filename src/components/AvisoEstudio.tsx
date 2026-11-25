import { URL_ANAC_RAAC } from "@/lib/estudio";

/** Aviso fijo de /estudio: el banco es orientativo y vale la norma que publica la ANAC. */
export function AvisoEstudio() {
  return (
    <aside className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
      <strong>Material orientativo, no oficial.</strong> No reemplaza el curso teórico de tu CIAC ni el examen de la
      ANAC, y las preguntas del examen real pueden ser distintas. Ante cualquier duda vale la norma publicada:{" "}
      <a href={URL_ANAC_RAAC} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline">
        RAAC en el sitio de la ANAC
      </a>
      .
    </aside>
  );
}
