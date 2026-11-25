import { BandaFoto } from "@/components/BandaFoto";

export default function Layout({ children }: LayoutProps<"/licencias">) {
  return (
    <>
      <BandaFoto foto="learjet" etiqueta="Licencias y habilitaciones" posicion="center 60%" />
      {children}
    </>
  );
}
