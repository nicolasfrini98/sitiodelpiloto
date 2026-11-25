// Fotos de aviación civil argentina de Wikimedia Commons, con licencia libre.
// Si agregás una, respetá la licencia: autor, licencia y enlace al archivo original.
import type { StaticImageData } from "next/image";
import aconcagua from "../../public/fotos/aconcagua-onda.jpg";
import cessna from "../../public/fotos/cessna-aeroclub-posadas.jpg";
import learjet from "../../public/fotos/learjet-bariloche.jpg";
import pa18 from "../../public/fotos/pa18-concordia.jpg";
import planeadorTierra from "../../public/fotos/planeador-en-tierra.jpg";
import remolque from "../../public/fotos/remolque-junin.jpg";
import tandil from "../../public/fotos/tandil-desde-planeador.jpg";
import aeroparque from "../../public/fotos/aeroparque-plataforma.jpg";

export type Foto = {
  src: StaticImageData;
  alt: string;
  lugar: string;
  autor: string;
  licencia: string;
  urlOriginal: string;
};

const COMMONS = "https://commons.wikimedia.org/wiki/File:";

export const FOTOS = {
  remolque: {
    src: remolque,
    alt: "Un avión remolca a un planeador en cielo azul",
    lugar: "Remolque de planeador en Junín, Buenos Aires",
    autor: "Germanramos",
    licencia: "Dominio público",
    urlOriginal: `${COMMONS}JUNIN_Planeador_remolcado_001.jpg`,
  },
  tandil: {
    src: tandil,
    alt: "Vista aérea de las sierras de Tandil con cúmulos, desde un planeador",
    lugar: "Tandil desde un planeador",
    autor: "Horacio Fernández",
    licencia: "CC BY 3.0",
    urlOriginal: `${COMMONS}Vista_a%C3%A9rea_de_Tandil_desde_un_planeador_._-_panoramio.jpg`,
  },
  planeadorTierra: {
    src: planeadorTierra,
    alt: "Una piloto en la cabina de un planeador, con su instructor al lado",
    lugar: "Planeador en un aeroclub argentino",
    autor: "Marcosmartinlp",
    licencia: "CC BY-SA 4.0",
    urlOriginal: `${COMMONS}Acrobacia_en_Planeador.jpg`,
  },
  aconcagua: {
    src: aconcagua,
    alt: "El Aconcagua con una nube lenticular, visto desde la cabina de un planeador",
    lugar: "Vuelo en onda frente al Aconcagua, Mendoza",
    autor: "René Heise",
    licencia: "CC BY-SA 3.0",
    urlOriginal: `${COMMONS}Aconcagua_MWP.jpg`,
  },
  aeroparque: {
    src: aeroparque,
    alt: "Plataforma del Aeroparque Jorge Newbery al atardecer vista desde la cabina, con aviones y la ciudad de fondo",
    lugar: "Plataforma de Aeroparque, Buenos Aires",
    autor: "Fredlyfish4",
    licencia: "CC BY-SA 4.0",
    urlOriginal: `${COMMONS}Aeroparque_Jorge_Newbery_December_2015.JPG`,
  },
  cessna: {
    src: cessna,
    alt: "Cessna 172 LV-OID estacionado en el pasto bajo un cielo con cúmulos",
    lugar: "Cessna 172 del Aeroclub Posadas, Misiones",
    autor: "Horacio Cambeiro",
    licencia: "CC BY-SA 4.0",
    urlOriginal: `${COMMONS}Cessna_172_XP_LV-OID_del_Aeroclub_Posadas.jpg`,
  },
  pa18: {
    src: pa18,
    alt: "Piper PA-18 amarillo sobre una pista de pasto",
    lugar: "Piper PA-18 en Concordia, Entre Ríos",
    autor: "Jrebolini",
    licencia: "Dominio público",
    urlOriginal: `${COMMONS}Pa18concordia.jpg`,
  },
  learjet: {
    src: learjet,
    alt: "Learjet LV-GQR rodando en la pista de Bariloche con montañas de fondo",
    lugar: "Learjet en San Carlos de Bariloche",
    autor: "BugWarp",
    licencia: "CC BY-SA 4.0",
    urlOriginal: `${COMMONS}LV-GQR_after_landing_at_Bariloche_01.jpg`,
  },
} satisfies Record<string, Foto>;

export type NombreFoto = keyof typeof FOTOS;
