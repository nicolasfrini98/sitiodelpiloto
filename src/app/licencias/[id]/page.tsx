import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvisoNormativo } from "@/components/AvisoNormativo";
import {
  buscarFicha,
  fechaCorta,
  FICHAS,
  fuentesDeFicha,
  NOMBRE_TIPO,
  SECCIONES_FICHA,
  type Requisito,
} from "@/lib/licencias";

export function generateStaticParams() {
  return FICHAS.map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }: PageProps<"/licencias/[id]">): Promise<Metadata> {
  const { id } = await params;
  const ficha = buscarFicha(id);
  return {
    title: ficha ? `${ficha.nombre} · Requisitos` : "Licencia no encontrada",
    description: ficha?.resumen,
  };
}

export default async function Page({ params }: PageProps<"/licencias/[id]">) {
  const { id } = await params;
  const ficha = buscarFicha(id);
  if (!ficha) notFound();
  const fuentes = fuentesDeFicha(ficha);

  return (
    <div className="space-y-8">
      <Link href="/licencias" className="text-sm text-sky-400 hover:underline">
        ← Todas las licencias y habilitaciones
      </Link>

      <header className="space-y-2">
        <p className="font-display text-lg font-semibold text-ambar">{NOMBRE_TIPO[ficha.tipo]}</p>
        <h1 className="text-4xl font-bold text-white sm:text-5xl">{ficha.nombre}</h1>
        <p className="max-w-3xl text-slate-300">{ficha.resumen}</p>
      </header>

      <AvisoNormativo />

      {ficha.cambiosRecientes.length > 0 && (
        <section className="space-y-2 rounded-md border border-sky-500/30 bg-sky-500/10 p-4">
          <h2 className="font-semibold text-sky-200">Cambio reciente</h2>
          <ul className="space-y-2 text-sm text-slate-200">
            {ficha.cambiosRecientes.map((c) => (
              <li key={c.texto}>
                {c.texto}{" "}
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">
                  {c.norma}, BO {fechaCorta(c.fecha)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {SECCIONES_FICHA.map((s) => {
          const lista = ficha[s.clave];
          if (lista.length === 0) return null;
          return (
            <section key={s.clave} className="rounded-md border border-trazo bg-slate-900/60 p-5">
              <h2 className="mb-3 font-semibold text-white">{s.titulo}</h2>
              <ListaRequisitos lista={lista} />
            </section>
          );
        })}
      </div>

      {ficha.notas && ficha.notas.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-white">Notas</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {ficha.notas.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold text-white">Fuentes oficiales</h2>
        <ul className="space-y-2 text-sm">
          {fuentes.map((f) => (
            <li key={f.id} className="text-slate-300">
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
                {f.titulo}
              </a>{" "}
              <span className="text-slate-500">({fechaCorta(f.fecha)})</span>
              {f.detalle && <span className="block text-xs text-slate-500">{f.detalle}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ListaRequisitos({ lista }: { lista: Requisito[] }) {
  return (
    <ul className="space-y-3 text-sm text-slate-200">
      {lista.map((r) => (
        <li key={r.texto}>
          <p>
            {r.texto}
            {r.aConfirmar && (
              <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] tracking-wide text-amber-300 uppercase">
                A confirmar
              </span>
            )}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-500">{r.cita}</p>
        </li>
      ))}
    </ul>
  );
}
