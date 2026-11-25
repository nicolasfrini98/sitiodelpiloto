# Sitio del Piloto

Sitio web para pilotos de planeador y de avión en carrera en Argentina. Secciones:

| Ruta            | Estado        | Qué es                                                                 |
| --------------- | ------------- | ---------------------------------------------------------------------- |
| `/metar`        | Hecha         | Último METAR de cada aeródromo argentino, filtros, categoría de vuelo  |
| `/metar/[icao]` | Hecha         | Ficha: METAR decodificado, TAF, historial 12 h, altitud de densidad, base de cúmulos |
| `/meteorologia` | Placeholder   | Meteorología en tiempo real (satélite, radar, térmicas, viento en altura, SIGMET) |
| `/novedades`    | Placeholder   | Noticias de vuelo a vela, carrera aérea y avisos ANAC/EANA             |
| `/estudio`      | Placeholder   | Preguntas y respuestas por licencia ANAC                               |
| `/regulaciones` | Placeholder   | Informe que se actualiza cuando la ANAC cambia las RAAC                |

## Stack

- Next.js 16 (App Router, Turbopack) con **Cache Components** activado (`cacheComponents: true`), React 19, TypeScript, Tailwind CSS 4.
- Next 16 cambió APIs respecto de versiones anteriores y puede no coincidir con lo que sabés de memoria: antes de escribir
  código de Next, leé la documentación incluida en `node_modules/next/dist/docs/`. En particular
  `01-app/01-getting-started/08-caching.md` (Cache Components, `"use cache"`, `cacheLife`, `<Suspense>`).

## Comandos

- `npm run dev` — servidor de desarrollo en http://localhost:3000
- `npm run build` — build de producción (también genera los tipos `PageProps`/`LayoutProps`; correr antes de `npx tsc --noEmit`)
- `npm run lint` — ESLint
- `npm run aerodromos` — regenera `src/data/aerodromos.json` desde aviationweather.gov

## Convenciones

- **Idioma:** toda la interfaz, los nombres de componentes/funciones del dominio y los comentarios en español rioplatense
  ("Tocá", "Probá"). Términos aeronáuticos estándar en su forma OACI (METAR, TAF, QNH, CAVOK, AGL).
- **Horas:** mostrar siempre UTC (`Z`) y, cuando suma, hora local argentina (`America/Argentina/Buenos_Aires`, UTC−3).
  Nunca usar `Date.now()` en un Server Component: los tiempos relativos ("hace 5 min") van en el cliente (`<Hace />`).
- **Datos externos:** cada fuente vive en un módulo de `src/lib/` y devuelve `Resultado<T>` (`{ok, datos}` o `{ok:false, error}`),
  nunca tira excepciones a la página. Las funciones que piden datos usan `"use cache"` + `cacheLife(...)`.
  Los componentes async que las usan van dentro de `<Suspense>`.
- **Seguridad operacional:** el sitio es informativo. Todo cálculo derivado (altitud de densidad, base de cúmulos) se rotula
  como aproximado. No inventar datos meteorológicos ni normativos: si una fuente falla, mostrar el error.
- **Contenido ANAC:** toda pregunta, respuesta o resumen normativo debe citar la fuente oficial (RAAC parte/sección,
  documento ANAC, fecha). Nada de respuestas "de memoria".

## Fuentes de datos

- METAR/TAF/estaciones: `https://aviationweather.gov/api/data/` (pública, sin clave, cache de 60 s). Redistribuye los reportes del SMN.
  Solo ~93 aeródromos argentinos publican METAR; el resto no tiene estación meteorológica.
- Pendientes de integrar: SMN (`smn.gob.ar`), NOTAM de EANA/ANAC (`ais.anac.gob.ar`), RAAC (`anac.gob.ar`), Boletín Oficial.

## Agentes del proyecto (`.claude/agents/`)

- `meteorologia-aeronautica` — features de meteorología, decodificación y fuentes de datos meteo.
- `contenido-anac` — bancos de preguntas por licencia, con citas a la normativa.
- `monitor-regulaciones` — detecta cambios en la normativa ANAC y redacta el informe.
- `verificador-web` — compila, levanta el sitio y lo revisa en el navegador (escritorio y celular).

Usalos delegando tareas de su área; cada uno trabaja con su propio contexto y devuelve un resumen.
