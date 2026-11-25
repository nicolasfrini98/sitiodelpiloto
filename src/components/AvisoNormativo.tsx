import { fechaCorta, NORMATIVA_CONSULTADA, ULTIMA_REVISION, URL_RAAC_ANAC } from "@/lib/licencias";

/** Aviso fijo de las páginas de /licencias: es un resumen, la norma vale lo que diga la ANAC. */
export function AvisoNormativo() {
  return (
    <aside className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
      <p>
        <strong>Resumen orientativo; la norma oficial es la RAAC publicada por la ANAC.</strong>{" "}
        <a href={URL_RAAC_ANAC} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline">
          Ver las RAAC en el sitio de la ANAC
        </a>
        . Antes de iniciar un trámite, confirmá los requisitos con la ANAC o tu CIAC.
      </p>
      <p className="mt-2 text-xs text-amber-200/80">
        Normativa consultada:{" "}
        {NORMATIVA_CONSULTADA.map((n, i) => (
          <span key={n.parte}>
            {i > 0 && " · "}
            {n.parte} {n.edicion}, {n.aprobadaPor}
            {n.enmiendas.length > 0 && `, con enmienda ${n.enmiendas.join(", ")}`}
          </span>
        ))}
        . Última revisión: {fechaCorta(ULTIMA_REVISION)}.
      </p>
    </aside>
  );
}
