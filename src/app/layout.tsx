import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Encabezado } from "@/components/Encabezado";
import { Pie } from "@/components/Pie";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Sitio del Piloto", template: "%s · Sitio del Piloto" },
  description:
    "Novedades, METAR/TAF de aeródromos argentinos, meteorología en tiempo real y material de estudio ANAC para pilotos de planeador y avión.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Encabezado />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <Pie />
      </body>
    </html>
  );
}
