import { BandaFoto } from "@/components/BandaFoto";

export default function Layout({ children }: LayoutProps<"/novedades">) {
  return (
    <>
      <BandaFoto foto="pa18" etiqueta="Novedades" posicion="center 55%" />
      {children}
    </>
  );
}
