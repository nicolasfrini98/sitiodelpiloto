import { BandaFoto } from "@/components/BandaFoto";

export default function Layout({ children }: LayoutProps<"/metar">) {
  return (
    <>
      <BandaFoto foto="torre" etiqueta="METAR · TAF" posicion="center 30%" />
      {children}
    </>
  );
}
