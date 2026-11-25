import { FOTOS, type NombreFoto } from "@/lib/fotos";

export function CreditoFoto({ foto, className = "" }: { foto: NombreFoto; className?: string }) {
  const f = FOTOS[foto];
  return (
    <figcaption className={`text-right text-[10px] leading-tight text-white/70 ${className}`}>
      {f.lugar} ·{" "}
      <a href={f.urlOriginal} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
        {f.autor}, {f.licencia}
      </a>
    </figcaption>
  );
}
