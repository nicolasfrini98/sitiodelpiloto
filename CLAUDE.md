# Sitio del Piloto

Sitio web para pilotos de planeador y de avión en carrera en Argentina. Secciones:

| Ruta            | Estado        | Qué es                                                                 |
| --------------- | ------------- | ---------------------------------------------------------------------- |
| `/metar`        | Hecha         | Último METAR de cada aeródromo argentino, filtros, categoría de vuelo  |
| `/metar/[icao]` | Hecha         | Ficha: METAR decodificado, TAF, historial 12 h, altitud de densidad, base de cúmulos |
| `/meteorologia` | Hecha         | Mapa de METAR (Leaflet) con SIGMET, alertas SMN y radar; SIGMET de las FIR argentinas; alertas SMN (CAP); pronóstico horario para vuelo a vela por aeródromo (`?icao=`); satélite GOES-19 |
| `/licencias`    | Hecha         | Requisitos por licencia/habilitación (RAAC 61 Ed. VI + Res. 292/2026, RAAC 67 Ed. V) con cita por requisito; datos en `src/data/licencias.json`, tipos en `src/lib/licencias.ts` |
| `/licencias/[id]` | Hecha       | Ficha de cada licencia/habilitación: requisitos, cambios recientes, fuentes oficiales |
| `/novedades`    | Hecha         | Agregador de noticias (ANAC, EANA, Aviacionline, Gaceta Aeronáutica, Gliding Australia, DG, EASA, AOPA) con filtro por categoría y estado de cada fuente; fuentes y parser en `src/lib/novedades.ts` (`obtenerUltimasNovedades(n)` para la portada) |
| `/estudio`      | Hecha         | Banco de preguntas para los teóricos ANAC (planeador, privado, comercial, instructor) con fuente y `verificada` por pregunta; datos en `src/data/estudio/` (un JSON por materia + `indice.json`); el cuestionario oficial ANAC de piloto privado (sept. 2014, copiado tal cual; las figuras del anexo ANAC están en `public/estudio/figuras-ppa/`) está en `anac-ppa-2014.json` y sale primero (`oficial: true`), tipos en `src/lib/estudio.ts` |
| `/estudio/[licencia]` | Hecha    | Modo práctica (explicación y fuente al responder, filtro por materia) y modo examen (al azar, cronómetro, revisión de errores); progreso en localStorage |
| `/regulaciones` | Hecha         | Informe mensual de cambios normativos (ANAC/BO): línea de tiempo con filtro por destinatario e impacto, plazos que vienen; datos en `src/data/regulaciones.json`, tipos en `src/lib/regulaciones.ts`, corrida mensual en `docs/revision-mensual-regulaciones.md` |

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
- SIGMET: `https://aviationweather.gov/api/data/isigmet?format=json`, filtrado por FIR SAEF/SACF/SAMF/SARR/SAVF.
- Alertas SMN: feed CAP oficial `https://ssl.smn.gob.ar/CAP/AR.php` (RSS índice → un XML CAP por zona). CC BY 4.0.
- Pronóstico para vuelo a vela: Open-Meteo `https://api.open-meteo.com/v1/forecast` (sin clave, CC BY 4.0).
- Radar: RainViewer `https://api.rainviewer.com/public/weather-maps.json` (teselas hasta zoom 7; cobertura parcial en Argentina).
- Satélite: GOES-19 de NOAA/NESDIS STAR, sector `ssa` (`https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/ssa/`).
- Mapa base: teselas de OpenStreetMap (`tile.openstreetmap.org`, oscurecidas con CSS; atribución obligatoria). Los basemaps de CARTO ahora devuelven "API KEY REQUIRED" sin clave.
- Normativa (`/regulaciones`, `/licencias`): Boletín Oficial, página de RAAC de la ANAC e InfoLEG (`argentina.gob.ar/normativa`), relevados a mano una vez por mes (no se piden en tiempo de ejecución). `boletinoficial.gob.ar` e InfoLEG devuelven 403 a `curl`: usar WebFetch/WebSearch.
- Noticias (`/novedades`): RSS de EANA (`eana.com.ar/rss.xml`, sin licitaciones), Aviacionline (`/rss.xml`, solo `/espanol/`), Gaceta Aeronáutica, Gliding Australia, DG Aviation, EASA y AOPA; la ANAC no tiene feed y se lee el listado HTML de `argentina.gob.ar/anac/noticias`. Cache de horas por fuente; solo título, bajada corta y enlace. Descartadas (FAVAV, FAI/IGC, WeGlide, OLC, SSA, BGA, FAA, OACI…) documentadas al final de `src/lib/novedades.ts`.
- Pendientes de integrar: productos aeronáuticos del SMN (`smn.gob.ar`), NOTAM de EANA/ANAC (`ais.anac.gob.ar`).

## Agentes del proyecto (`.claude/agents/`)

- `meteorologia-aeronautica` — features de meteorología, decodificación y fuentes de datos meteo.
- `contenido-anac` — bancos de preguntas por licencia, con citas a la normativa.
- `monitor-regulaciones` — detecta cambios en la normativa ANAC y redacta el informe.
- `verificador-web` — compila, levanta el sitio y lo revisa en el navegador (escritorio y celular).

Usalos delegando tareas de su área; cada uno trabaja con su propio contexto y devuelve un resumen.
