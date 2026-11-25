import Image from "next/image";
import { FOTOS, type NombreFoto } from "@/lib/fotos";
import { CreditoFoto } from "./CreditoFoto";

/**
 * Banda con foto que encabeza cada sección. La etiqueta es un cartel de posición de calle de rodaje
 * (negro con letras amarillas): dice "dónde estás". El título real (h1) sigue en la página.
 */
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
    <figure className="relative -mx-4 -mt-8 mb-10 h-48 overflow-hidden border-b border-trazo sm:mx-0 sm:mt-0 sm:h-64 sm:rounded-md sm:border">
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
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      <span className="etiqueta-hud absolute top-4 left-4 sm:left-6">{etiqueta}</span>
      <CreditoFoto foto={foto} className="absolute right-3 bottom-2 sm:right-4" />
    </figure>
  );
}
