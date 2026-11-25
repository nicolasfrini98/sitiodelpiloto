# Revisión mensual de regulaciones

Instrucciones para la corrida mensual que mantiene `/regulaciones`. La ejecuta el subagente `monitor-regulaciones`
(invocado por una tarea programada). La idea es que cada corrida sea corta, repetible y deje el repo compilando.

**Reglas que no se negocian**

- No hacer commit ni push: la corrida deja los cambios en el árbol de trabajo para que una persona los revise.
- Un cambio es `"confirmado"` solo si abriste la fuente oficial (aviso del Boletín Oficial, texto en
  `argentina.gob.ar/normativa` o InfoLEG, o página de la ANAC). Si solo lo viste en prensa, FADA o un buscador, va como
  `"sin-confirmar"` y lo decís en el resumen.
- Resumí con tus palabras, corto. No copies el texto de la norma.
- `boletinoficial.gob.ar` e InfoLEG devuelven 403 a `curl`: usá WebFetch/WebSearch.

## 1. Punto de partida

1. Leé `CLAUDE.md` y `src/data/regulaciones.json`.
2. Anotá `revisadoHasta` (por ejemplo `2026-11-25`). Vas a buscar normas **publicadas en el Boletín Oficial
   después de esa fecha y hasta hoy**. Si la corrida anterior falló, igual buscás desde `revisadoHasta`: nunca se salta
   un período.

## 2. Qué revisar

Son las mismas fuentes que lista `fuentesMonitoreadas` en el JSON:

| Fuente | Cómo |
| --- | --- |
| Boletín Oficial, primera sección | WebSearch: `site:boletinoficial.gob.ar "Administración Nacional de Aviación Civil" Resolución <año>` y variantes con el mes (`julio 2026`), con `Disposición` y con `DNSO`. Abrí con WebFetch cada aviso nuevo (`/detalleAviso/primera/<n>/<AAAAMMDD>`). |
| ANAC — RAAC vigentes | WebFetch de `https://www.argentina.gob.ar/anac/resoluciones-disposiciones-y-otras-normas-aeronauticas/raac`: buscá resoluciones nuevas en cada Parte. |
| ANAC — Resoluciones y disposiciones | WebFetch de `https://www.argentina.gob.ar/anac/normativa/resoluciones-y-disposiciones`. |
| Normativa nacional (InfoLEG) | `https://www.argentina.gob.ar/normativa/nacional/norma-<n>/texto` para leer artículos y plazos cuando el aviso del BO no alcanza. |
| AIP/AIC | `https://ais.anac.gob.ar/` y `eana.com.ar`: AIC o enmiendas AIP que cambien espacio aéreo o procedimientos para VFR/planeadores. |

Búsquedas extra útiles (WebSearch, modo `extended` si la estándar no trae nada): `ANAC resolución <mes> <año> RAAC`,
`ANAC Parte 61 enmienda <año>`, `ANAC Parte 91 <año>`, `ANAC Parte 67`, `ANAC Parte 141 CIAC`, `ANAC Parte 103
ultralivianos`, `ANAC examinadores`, `FADA alerta normativa` (FADA sirve solo para descubrir; confirmá en el BO).

### Qué entra al informe

Entra lo que afecta a **pilotos** o a su entorno inmediato:

- Partes 61 (licencias), 67 (médico), 91 (reglas de vuelo), 141/142 (CIAC/CEAC), 103 (ultralivianos), 11 (cómo se
  hacen las RAAC), 77/153/154 (aeródromos), 137 (trabajo aéreo), 203 (meteorología), exámenes y examinadores,
  espacio aéreo y procedimientos (AIC relevantes).
- Decretos que cambien servicios que usan los pilotos (por ejemplo, el MET).

No entra (salvo que toque a pilotos de aviación general): designaciones individuales de médicos examinadores,
drones (Parte 100/102), operadores extranjeros (Parte 129), certificados de aerolíneas, tasas, conciliación con
pasajeros, medidas por conflictos gremiales. Mencioná en el resumen lo que descartaste si fue dudoso.

## 3. Cómo agregar un cambio al JSON

Agregá un objeto a `cambios[]` (el orden en el archivo no importa: la página ordena por fecha). Campos:

```jsonc
{
  "id": "res-anac-123-2027",            // estable: tipo-organismo-numero-año. Nunca cambiar un id existente.
  "fechaPublicacion": "2027-01-15",     // fecha del BO, no la de firma
  "tipo": "Resolución",                 // Resolución | Disposición | Decreto | Decreto de necesidad y urgencia | AIC
  "numero": "123/2027",
  "organismo": "ANAC",                  // o "ANAC — Dirección Nacional de Seguridad Operacional", "Poder Ejecutivo Nacional"
  "titulo": "Enmienda de la Parte 91 — …",
  "partes": ["RAAC 91 (91.119)"],
  "resumen": "Dos o tres oraciones en lenguaje claro: qué cambia, para quién, desde cuándo.",
  "aQuienAfecta": ["avion", "planeador"], // todos | avion | planeador | ultraliviano | alumnos | instructores |
                                          // examinadores | ciac | aerodromos | explotadores | propietarios
  "impacto": "alto",                    // alto: cambia lo que un piloto tiene que hacer o saber; medio: afecta a un grupo
                                        // o un trámite; bajo: indirecto o administrativo
  "enlace": "https://www.boletinoficial.gob.ar/detalleAviso/primera/<n>/<AAAAMMDD>",
  "enlacesExtra": [{ "titulo": "Anexo (InfoLEG)", "url": "https://…" }],   // opcional
  "estado": "confirmado",               // o "sin-confirmar"
  "fechasClave": [{ "fecha": "2027-12-31", "descripcion": "…", "aproximada": false }], // opcional; plazos y vigencias
  "fichas": ["piloto-privado-avion"],   // opcional; ids de src/data/licencias.json que este cambio modifica
  "notas": "Opcional: qué no se pudo leer (anexos), dudas, qué revisar."
}
```

- Si una norma nueva **reemplaza o corrige** otra que ya está, no borres la vieja: agregá la nueva y mencioná el
  reemplazo en ambos resúmenes/notas.
- Si un `"sin-confirmar"` de una corrida anterior ahora se puede abrir, pasalo a `"confirmado"` y corregí lo que haga
  falta.
- Plazos con "N días hábiles": calculá una fecha aproximada y marcá `"aproximada": true`.
- Al final actualizá `ultimaRevision` y `revisadoHasta` a la fecha de hoy (si encontraste cambios o si no).

## 4. ¿Hay que tocar `/licencias` o `/estudio`?

**`src/data/licencias.json`** — actualizalo en la misma corrida si el cambio modifica un requisito de una ficha
(Partes 61 y 67 sobre todo, o una regla de la Parte 91 que esté citada en una ficha):

1. Corregí el `Requisito` afectado (texto y `cita`). Si no pudiste leer el anexo, marcá `"aConfirmar": true`.
2. Agregá un `CambioReciente` a la ficha (`texto`, `norma`, `fecha`, `url`).
3. Si es una edición o enmienda nueva de la 61 o la 67, actualizá `normativaConsultada` y sumá la norma a `fuentes`.
4. Actualizá `ultimaRevision` del archivo.
5. En `regulaciones.json`, poné el id de la ficha en `fichas` del cambio.

**`src/data/estudio/*.json`** — si el cambio vuelve incorrecta una respuesta:

1. Buscá preguntas afectadas: `grep -rn "<sección, ej. 91.119>" src/data/estudio` y por la `fuente.id` (por ejemplo
   `raac91-2017`, `raac61`).
2. Si podés confirmar la respuesta nueva en la norma: corregí `opciones`/`correcta`/`explicacion`/`fuente.seccion`.
3. Si no podés confirmarla: poné `"verificada": false` y una `"nota"` del estilo
   `"Posiblemente desactualizada por Res. ANAC 123/2027 (BO 15/01/2027); falta revisar el anexo."`. No inventes la
   respuesta nueva.
4. Preguntas de banco de terceros que ya no aplican: dejalas con `verificada: false` y nota; la decisión de borrarlas
   es humana.

## 5. Verificar

```bash
npm run lint
npm run build      # falla si regulaciones.json tiene ids repetidos, fichas inexistentes,
                   # fechas mal escritas o "confirmado" sin enlace oficial (problemasDelInforme)
```

Opcional, si hubo cambios en la página: `npx next start -p 3127`, `curl -s -o /dev/null -w "%{http_code}"
http://localhost:3127/regulaciones` (tiene que dar 200) y cortar el server (PowerShell:
`Get-NetTCPConnection -LocalPort 3127 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`).

## 6. Qué devolver

Un resumen corto en español:

```
Revisión de regulaciones — <fecha de hoy> (período <revisadoHasta anterior> → <hoy>)

Cambios nuevos: <N>   (o "Sin cambios desde <revisadoHasta anterior>")
- <Tipo número> (BO dd/mm/aaaa) — <título> — impacto <alto|medio|bajo> — <confirmado|sin confirmar>
Sin confirmar: <lista o "ninguno"> y por qué
Descartados (fuera de alcance): <lista breve>
Plazos próximos (siguientes 90 días): <lista>
Efecto en /licencias: <fichas tocadas o "ninguno">
Efecto en /estudio: <preguntas corregidas / marcadas verificada:false o "ninguno">
Archivos modificados: <lista>
lint/build: OK | <error>
```
