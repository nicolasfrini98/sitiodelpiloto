import { CATEGORIAS, type Categoria } from "@/lib/metar";

export function CategoriaVuelo({ categoria }: { categoria?: Categoria | null }) {
  if (!categoria) {
    return <span className="rounded px-2 py-0.5 text-xs font-semibold text-slate-400 ring-1 ring-slate-600">S/D</span>;
  }
  const info = CATEGORIAS[categoria];
  return (
    <span title={info.desc} className={`rounded px-2 py-0.5 text-xs font-semibold ${info.clase}`}>
      {categoria}
    </span>
  );
}
