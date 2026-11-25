import { BandaFoto } from "@/components/BandaFoto";

export default function Layout({ children }: LayoutProps<"/metar">) {
  return (
    <>
      <BandaFoto foto="aeroparque" etiqueta="METAR · TAF" posicion="center 45%" />
      {children}
    </>
  );
}
