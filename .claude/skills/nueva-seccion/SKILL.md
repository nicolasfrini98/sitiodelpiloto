---
name: nueva-seccion
description: Receta para construir una sección nueva de Sitio del Piloto (o reemplazar un placeholder como /meteorologia, /novedades, /estudio o /regulaciones) siguiendo las convenciones del proyecto. Usala cuando haya que crear una página nueva o una fuente de datos nueva.
---

# Crear o completar una sección

1. **Leé la doc de Next incluida** en `node_modules/next/dist/docs/` para lo que vayas a usar (Cache Components está activo).
2. **Fuente de datos** → módulo nuevo en `src/lib/<fuente>.ts`:
   - Probá el endpoint con `curl` antes de escribir tipos.
   - Exportá funciones async con `"use cache"` y `cacheLife(...)` acorde a cada cuánto cambia el dato
     (`"minutes"` para METAR, `"hours"` para noticias, `"days"` para normativa).
   - Devolvé `Resultado<T>` (ver `src/lib/aviationweather.ts`); nunca tires excepciones hacia la página.
3. **Página** → `src/app/<ruta>/page.tsx`:
   - `export const metadata` con título en español.
   - El encabezado estático va afuera; lo que pide datos va en un componente async dentro de `<Suspense>`.
   - Interactividad (filtros, búsqueda) en un componente `"use client"` en `src/components/`, recibiendo datos ya serializables.
   - Si el dato cambia seguido, agregá `<AutoRefrescar />`.
4. **Navegación** → si es una sección nueva, sumala a `SECCIONES` en `src/components/Encabezado.tsx` y a `TARJETAS` en
   `src/app/page.tsx` (sacá el "Próximamente").
5. **Estilo** → Tailwind, fondo `slate-950`, tarjetas `border-white/10 bg-slate-900/60`, acento `sky`. Textos en rioplatense.
6. **Actualizá** la tabla de secciones en `CLAUDE.md`.
7. **Verificá** con el subagente `verificador-web`.
