import Image from "next/image";
import { FOTOS, type NombreFoto } from "@/lib/fotos";
import { CreditoFoto } from "./CreditoFoto";

/** Banda con foto que encabeza cada sección. El título real (h1) sigue en la página. */
export function BandaFoto({
  foto,
  etiqueta,
  posicion = "center",
}: {
  foto: NombreFoto;
  etiqueta: string;
  posicion?: string;
}) {
  const f = FOTOS[foto];
  return (
    <figure className="relative -mx-4 -mt-8 mb-8 h-56 sm:mt-0 overflow-hidden sm:mx-0 sm:h-80 sm:rounded-2xl">
      <Image
        src={f.src}
        alt={f.alt}
        fill
        priority
        placeholder="blur"
        sizes="(min-width: 1152px) 1152px, 100vw"
        className="object-cover"
        style={{ objectPosition: posicion }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-4 pb-3 sm:px-6">
        <span className="etiqueta-hud">{etiqueta}</span>
        <CreditoFoto foto={foto} />
      </div>
    </figure>
  );
}
