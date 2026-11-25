import { BandaFoto } from "@/components/BandaFoto";

export default function Layout({ children }: LayoutProps<"/estudio">) {
  return (
    <>
      <BandaFoto foto="planeadorTierra" etiqueta="Estudio · Teóricos ANAC" posicion="center 55%" />
      {children}
    </>
  );
}
