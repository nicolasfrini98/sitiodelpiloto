import {
  designadorLocal,
  obtenerFichaMadhel,
  obtenerNotams,
  URL_AIP_ANAC,
  URL_MADHEL,
  URL_NOTAM_ANAC,
} from "@/lib/anac-ais";
import { EXTRACCION_AIP, frecuenciasAip, nombreServicio } from "@/lib/frecuencias";
import { VigenciaNotam } from "./VigenciaNotam";

const AVISO_OFICIAL =
  "Información de referencia: no reemplaza la consulta del AIP, los NOTAM ni el boletín previo al vuelo en la oficina ARO-AIS.";

/** Frecuencias de los servicios ATS y radioayudas del aeródromo: AIP si está publicado ahí, MADHEL si no. */
export async function Frecuencias({ icao }: { icao: string }) {
  const aip = frecuenciasAip(icao);
  if (aip) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-white">Frecuencias y radioayudas</h2>
        {aip.ats.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-trazo">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <caption className="sr-only">Frecuencias de los servicios de tránsito aéreo</caption>
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Servicio</th>
                  <th className="px-3 py-2 font-medium">Frecuencia</th>
                  <th className="px-3 py-2 font-medium">Distintivo de llamada</th>
                  <th className="px-3 py-2 font-medium">Horario</th>
                </tr>
              </thead>
              <tbody>
                {aip.ats.map((f, i) => (
                  <tr key={i} className="border-t border-trazo align-top">
                    <td className="px-3 py-2 text-white">
                      {f.servicio ? nombreServicio(f.servicio) : "—"}
                      {f.servicio && <span className="block font-mono text-xs text-slate-500">{f.servicio}</span>}
                    </td>
                    <td className="px-3 py-2 font-mono text-base whitespace-nowrap text-ambar">
                      {f.frecuencia}
                      {f.canal && <span className="block text-xs text-slate-500">{f.canal}</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-300">{f.distintivo || "—"}</td>
                    <td className="px-3 py-2 text-slate-300">
                      {f.horario || "—"}
                      {f.observaciones && f.observaciones !== "NIL" && (
                        <span className="mt-1 block text-xs text-slate-500">{f.observaciones}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {aip.radioayudas.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-trazo">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <caption className="sr-only">Radioayudas para la navegación y el aterrizaje</caption>
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Radioayuda</th>
                  <th className="px-3 py-2 font-medium">Frecuencia</th>
                  <th className="px-3 py-2 font-medium">Identificación</th>
                  <th className="px-3 py-2 font-medium">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {aip.radioayudas.map((r, i) => (
                  <tr key={i} className="border-t border-trazo align-top">
                    <td className="px-3 py-2 text-white">{r.tipo || "—"}</td>
                    <td className="px-3 py-2 font-mono text-base whitespace-nowrap text-ambar">{r.frecuencia}</td>
                    <td className="px-3 py-2 font-mono text-slate-300">{r.id || "—"}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {[r.horario, r.observaciones].filter(Boolean).join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-400">
          Fuente:{" "}
          <a href={aip.url} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">
            {aip.documento}
          </a>
          , secciones AD 2.18 y AD 2.19
          {aip.airac ? `, AMDT AIRAC ${aip.airac}` : ""}. Datos extraídos del PDF el {EXTRACCION_AIP}; verificá siempre
          con el{" "}
          <a href={URL_AIP_ANAC} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">
            AIP vigente
          </a>
          . {AVISO_OFICIAL}
        </p>
      </section>
    );
  }

  const local = await designadorLocal(icao);
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-white">Frecuencias y radioayudas</h2>
      {!local.ok && <p className="text-red-400">No se pudo consultar el MADHEL de la ANAC: {local.error}</p>}
      {local.ok && !local.datos && (
        <p className="text-sm text-slate-400">
          Este aeródromo no figura en el AIP ni en el{" "}
          <a href={URL_MADHEL} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">
            MADHEL de la ANAC
          </a>
          .
        </p>
      )}
      {local.ok && local.datos && <FichaMadhel local={local.datos} />}
    </section>
  );
}

async function FichaMadhel({ local }: { local: string }) {
  const r = await obtenerFichaMadhel(local);
  if (!r.ok) return <p className="text-red-400">No se pudo consultar el MADHEL de la ANAC: {r.error}</p>;
  const f = r.datos;
  if (f.remiteAlAip) {
    return (
      <p className="text-sm text-slate-400">
        El MADHEL remite al AIP para este aeródromo.{" "}
        <a href={URL_AIP_ANAC} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">
          Consultá el AIP de la ANAC
        </a>{" "}
        (sección AD 2.18).
      </p>
    );
  }
  return (
    <>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Bloque titulo="Servicios de tránsito aéreo" lineas={f.ats} vacio="Sin datos en el MADHEL" />
        <Bloque titulo="Radioayudas" lineas={f.radioayudas} vacio="Sin radioayudas en el MADHEL" />
        {f.horario && <Bloque titulo="Horario de servicios" lineas={[f.horario]} />}
        {f.combustible && <Bloque titulo="Combustible" lineas={[f.combustible]} />}
      </dl>
      <p className="text-xs text-slate-400">
        Fuente:{" "}
        <a href={URL_MADHEL} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">
          MADHEL de la ANAC
        </a>{" "}
        ({f.nombre}){f.actualizado && `, actualizado el ${f.actualizado.slice(0, 10)}`}. {AVISO_OFICIAL}
      </p>
    </>
  );
}

function Bloque({ titulo, lineas, vacio }: { titulo: string; lineas: string[]; vacio?: string }) {
  return (
    <div className="rounded-md border border-trazo bg-slate-900/60 p-3">
      <dt className="text-sm text-slate-400">{titulo}</dt>
      {lineas.length > 0 ? (
        lineas.map((l, i) => (
          <dd key={i} className="mt-1 whitespace-pre-line text-white">
            {l}
          </dd>
        ))
      ) : (
        <dd className="mt-1 text-slate-500">{vacio}</dd>
      )}
    </div>
  );
}

/** NOTAM activos del aeródromo (series A y C), en tiempo real desde la ANAC. */
export async function Notams({ icao }: { icao: string }) {
  const local = await designadorLocal(icao);
  if (!local.ok)
    return (
      <SeccionNotam>
        <p className="text-red-400">No se pudieron consultar los NOTAM: {local.error}</p>
      </SeccionNotam>
    );
  if (!local.datos)
    return (
      <SeccionNotam>
        <p className="text-sm text-slate-400">
          No encontramos el designador ANAC de este aeródromo. Buscalo en la{" "}
          <a href={URL_NOTAM_ANAC} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">
            consulta de NOTAM de la ANAC
          </a>
          .
        </p>
      </SeccionNotam>
    );

  const r = await obtenerNotams(local.datos);
  return (
    <SeccionNotam>
      {!r.ok && <p className="text-red-400">No se pudieron consultar los NOTAM de la ANAC: {r.error}</p>}
      {r.ok && r.datos.length === 0 && (
        <p className="rounded-md border border-trazo bg-slate-900/60 p-4 text-slate-300">
          No hay NOTAM activos de las series A y C para este aeródromo ({local.datos}). Revisá igual los NOTAM de la FIR
          en la consulta de la ANAC.
        </p>
      )}
      {r.ok && r.datos.length > 0 && (
        <ol className="space-y-3">
          {r.datos.map((n) => (
            <li key={n.numero} className="space-y-2 rounded-md border border-trazo bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-mono font-semibold text-ambar">{n.numero}</span>
                <VigenciaNotam desde={n.desde} hasta={n.hasta} />
                <span className="text-slate-400">
                  Desde {fecha(n.desde)} hasta {n.hasta ? fecha(n.hasta) : "permanente (PERM)"}
                </span>
              </div>
              <p className="font-mono text-sm break-words text-white">{n.texto}</p>
              {n.textoEs && <p className="text-sm text-slate-300">{n.textoEs}</p>}
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-slate-400">
        Fuente:{" "}
        <a href={URL_NOTAM_ANAC} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">
          consulta de NOTAM de la ANAC
        </a>{" "}
        (datos de la Oficina NOTAM Internacional de EANA), designador {local.datos}. Se actualiza cada 15 minutos. No
        incluye los NOTAM de la FIR ni sirve como boletín previo al vuelo (PIB).
      </p>
    </SeccionNotam>
  );
}

function SeccionNotam({ children }: { children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-white">NOTAM</h2>
      {children}
    </section>
  );
}

/** "2026-11-30T15:30:00Z" → "30/11 15:30Z". */
function fecha(iso: string | null): string {
  if (!iso) return "—";
  const m = iso.match(/^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? `${m[2]}/${m[1]} ${m[3]}:${m[4]}Z` : iso;
}
