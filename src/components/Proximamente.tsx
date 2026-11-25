/** Placeholder para las secciones que todavía no están construidas. */
export function Proximamente({ titulo, intro, planes }: { titulo: string; intro: string; planes: string[] }) {
  return (
    <section className="max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold text-white">{titulo}</h1>
      <p className="text-slate-300">{intro}</p>
      <div className="rounded-xl border border-dashed border-white/15 bg-slate-900/50 p-5">
        <p className="mb-2 text-sm font-semibold text-amber-300">En construcción. Lo que viene:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {planes.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
