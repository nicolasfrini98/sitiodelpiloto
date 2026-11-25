import { BandaFoto } from "@/components/BandaFoto";

export default function Layout({ children }: LayoutProps<"/regulaciones">) {
  return (
    <>
      <BandaFoto foto="cessna" etiqueta="Regulaciones · RAAC" posicion="center 55%" />
      {children}
    </>
  );
}
