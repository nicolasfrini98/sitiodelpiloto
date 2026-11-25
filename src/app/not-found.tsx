import Link from "next/link";

export default function NoEncontrado() {
  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-bold text-white">No encontramos esa página</h1>
      <p className="text-slate-300">Si buscabas un aeródromo, revisá el código OACI (por ejemplo SACO o SAZS).</p>
      <Link href="/metar" className="text-sky-400 hover:underline">
        Ver todos los METAR →
      </Link>
    </section>
  );
}
