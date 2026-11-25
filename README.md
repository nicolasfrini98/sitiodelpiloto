# Sitio del Piloto

Sitio para pilotos de planeador y de avión en Argentina: METAR/TAF de todos los aeródromos argentinos, meteorología en
tiempo real, novedades, material de estudio por licencia ANAC e informe de cambios en la normativa.

## Estado

- ✅ **METAR / TAF** (`/metar`, `/metar/SACO`, …): último reporte de los ~93 aeródromos argentinos que publican METAR,
  con búsqueda, filtro por provincia y categoría de vuelo, TAF, historial de 12 h, altitud de densidad y base estimada
  de cúmulos. Datos de [aviationweather.gov](https://aviationweather.gov/data/api/) (NOAA), que redistribuye los
  reportes del SMN.
- 🚧 Meteorología, Novedades, Estudio y Regulaciones: estructura creada, contenido pendiente.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de producción
npm run aerodromos # actualiza la lista de aeródromos
```

Stack: Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4.

## Trabajar con Claude Code

- `CLAUDE.md`: contexto y convenciones que Claude lee en cada sesión.
- `.claude/agents/`: subagentes especializados (meteorología, contenido ANAC, monitor de regulaciones, verificador web).
- `.claude/skills/nueva-seccion/`: receta para construir una sección nueva.

## Aviso

Uso informativo. No reemplaza la información oficial de EANA, el SMN ni la ANAC.
