import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvisoEstudio } from "@/components/AvisoEstudio";
import { BancoPreguntas } from "@/components/BancoPreguntas";
import {
  buscarLicenciaEstudio,
  conteoPorMateria,
  fuentesCitadas,
  LICENCIAS_ESTUDIO,
  PORCENTAJE_APROBACION,
  preguntasDeLicencia,
} from "@/lib/estudio";
import { buscarFicha } from "@/lib/licencias";

export function generateStaticParams() {
  return LICENCIAS_ESTUDIO.map((l) => ({ licencia: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/estudio/[licencia]">): Promise<Metadata> {
  const { licencia } = await params;
  const l = buscarLicenciaEstudio(licencia);
  return {
    title: l ? `${l.nombre} · Preguntas` : "Licencia no encontrada",
    description: l ? `Banco de preguntas para el examen teórico ANAC de ${l.nombre.toLowerCase()}.` : undefined,
  };
}

export default async function Page({ params }: PageProps<"/estudio/[licencia]">) {
  const { licencia } = await params;
  const l = buscarLicenciaEstudio(licencia);
  if (!l) notFound();

  const preguntas = preguntasDeLicencia(l.id);
  const conteo = conteoPorMateria(preguntas);
  const fichas = l.fichas.map((id) => buscarFicha(id)).filter((f) => f !== undefined);
  const fuentes = fuentesCitadas(preguntas);

  return (
    <div className="space-y-8">
      <Link href="/estudio" className="text-sm text-sky-400 hover:underline">
        ← Todas las licencias
      </Link>

      <header className="space-y-2">
        <p className="font-display text-lg font-semibold text-ambar">Banco de preguntas</p>
        <h1 className="text-4xl font-bold text-white sm:text-5xl">{l.nombre}</h1>
        <p className="max-w-3xl text-slate-300">
          {preguntas.length} preguntas en {conteo.length} materias. Materias que exige la ANAC ({l.citaMaterias}):{" "}
          {l.materiasAnac}
        </p>
        {fichas.length > 0 && (
          <p className="text-sm text-slate-400">
            Requisitos de la licencia:{" "}
            {fichas.map((f, i) => (
              <span key={f.id}>
                {i > 0 && " · "}
                <Link href={`/licencias/${f.id}`} className="text-sky-400 hover:underline">
                  {f.nombre}
                </Link>
              </span>
            ))}
          </p>
        )}
      </header>

      <AvisoEstudio />

      <BancoPreguntas
        preguntas={preguntas}
        materias={conteo.map((c) => c.materia)}
        porcentajeAprobacion={PORCENTAJE_APROBACION}
      />

      <section className="space-y-2 text-sm text-slate-400">
        <h2 className="font-semibold text-white">Fuentes de este banco</h2>
        <ul className="list-disc space-y-1 pl-5">
          {fuentes.map((f) => (
            <li key={f.id}>
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">
                {f.documento}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
