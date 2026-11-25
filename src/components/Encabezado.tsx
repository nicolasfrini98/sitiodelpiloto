import Link from "next/link";
import { Logo } from "./Logo";
import { NavSecciones } from "./NavSecciones";
import { Reloj } from "./Reloj";

export const SECCIONES = [
  { href: "/metar", titulo: "METAR / TAF" },
  { href: "/meteorologia", titulo: "Meteorología" },
  { href: "/licencias", titulo: "Licencias" },
  { href: "/estudio", titulo: "Estudio" },
  { href: "/regulaciones", titulo: "Regulaciones" },
  { href: "/novedades", titulo: "Novedades" },
];

export function Encabezado() {
  return (
    <header className="sticky top-0 z-[1100] border-b border-trazo bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-white">
          <Logo className="h-7 w-7 text-cielo sm:h-8 sm:w-8" />
          <span className="font-display text-lg leading-none font-bold sm:text-[1.35rem]">Sitio del Piloto</span>
        </Link>
        <NavSecciones secciones={SECCIONES} />
        <Reloj className="ml-auto" />
      </div>
    </header>
  );
}
