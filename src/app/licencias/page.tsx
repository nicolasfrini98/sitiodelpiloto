import type { Metadata } from "next";
import Link from "next/link";
import { AvisoNormativo } from "@/components/AvisoNormativo";
import { FICHAS, NOMBRE_TIPO, type Ficha } from "@/lib/licencias";

export const metadata: Metadata = {
  title: "Licencias y habilitaciones",
  description:
    "Requisitos para obtener cada licencia y habilitación de piloto en Argentina según la RAAC 61 y 67 vigentes, con la cita a cada sección.",
};

const GRUPOS: { titulo: string; texto: string; filtro: (f: Ficha) => boolean }[] = [
  {
    titulo: "Licencias",
    texto: "El camino básico: alumno piloto, planeador, privado y comercial.",
    filtro: (f) => f.tipo === "licencia" || f.tipo === "autorizacion",
  },
  {
    titulo: "Habilitaciones y atribuciones",
    texto: "Lo que se suma a una licencia: instrumentos, multimotor, instructor, remolque y vuelo nocturno.",
    filtro: (f) => f.tipo === "habilitacion" || f.tipo === "atribucion",
  },
];

export default function Page() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Licencias y habilitaciones</h1>
        <p className="max-w-3xl text-slate-300">
          Qué pide la ANAC para cada licencia y habilitación de piloto: edad, certificado médico, examen teórico, horas
          de vuelo, prueba de pericia, atribuciones y cómo mantenerla vigente. Cada requisito cita la sección de la
          RAAC de donde sale.
        </p>
      </header>

      <AvisoNormativo />

      {GRUPOS.map((g) => (
        <section key={g.titulo} className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-white">{g.titulo}</h2>
            <p className="text-sm text-slate-400">{g.texto}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FICHAS.filter(g.filtro).map((f) => (
              <Tarjeta key={f.id} ficha={f} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Tarjeta({ ficha }: { ficha: Ficha }) {
  const edad = ficha.edad[0]?.texto;
  const medico = ficha.aptitudPsicofisica[0]?.texto;
  const hayCambios = ficha.cambiosRecientes.length > 0;
  return (
    <Link
      href={`/licencias/${ficha.id}`}
      className="group flex flex-col rounded-xl border border-white/10 bg-slate-900/60 p-5 hover:border-sky-500/50 hover:bg-slate-900"
    >
      <div className="flex items-center gap-2 text-[10px] tracking-wide uppercase">
        <span className="text-sky-300">{NOMBRE_TIPO[ficha.tipo]}</span>
        {hayCambios && <span className="text-amber-300">· Cambio reciente</span>}
      </div>
      <h3 className="mt-1 font-semibold text-white group-hover:text-sky-300">{ficha.nombre}</h3>
      <p className="mt-1 text-sm text-slate-400">{ficha.resumen}</p>
      <dl className="mt-3 space-y-1 text-xs text-slate-300">
        {edad && (
          <div>
            <dt className="inline text-slate-500">Edad: </dt>
            <dd className="inline">{edad}</dd>
          </div>
        )}
        {medico && (
          <div>
            <dt className="inline text-slate-500">Médico: </dt>
            <dd className="inline">{medico}</dd>
          </div>
        )}
      </dl>
      <span className="mt-auto pt-3 text-sm text-sky-400">Ver requisitos →</span>
    </Link>
  );
}
