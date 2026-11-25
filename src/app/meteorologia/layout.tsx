import { BandaFoto } from "@/components/BandaFoto";

export default function Layout({ children }: LayoutProps<"/meteorologia">) {
  return (
    <>
      <BandaFoto foto="tandil" etiqueta="Meteorología" posicion="center 40%" />
      {children}
    </>
  );
}
