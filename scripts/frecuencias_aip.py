"""
Extrae las frecuencias ATS (AD 2.18) y las radioayudas (AD 2.19) de cada aeródromo del AIP Argentina
y las guarda en src/data/frecuencias-aip.json.

Fuente: https://ais.anac.gob.ar/aip (pestaña AD), un PDF "XXXX-AD-2.0 Datos del AD" por aeródromo.
Se usa la edición vigente (la de fecha de efectividad más reciente que no sea futura).

Uso (una vez por ciclo AIRAC, o cuando haya enmiendas):
    python -m pip install pymupdf
    python scripts/frecuencias_aip.py

El resultado se revisa a ojo antes de commitear (git diff): las tablas del AIP vienen en PDF y la
extracción puede fallar si cambia el formato. Si un aeródromo no se pudo leer, queda en "errores".
"""

import datetime as dt
import html
import json
import re
import sys
import urllib.request
from pathlib import Path

import pymupdf

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "src" / "data" / "frecuencias-aip.json"
BASE = "https://ais.anac.gob.ar"
UA = {"User-Agent": "sitiodelpiloto/0.1 (+https://github.com/nicolasfrini98/sitiodelpiloto)", "X-Requested-With": "XMLHttpRequest"}


def bajar(url: str) -> bytes:
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
        return r.read()


def ediciones_ad20() -> dict[str, dict]:
    """ICAO → {url, edicion, vigencia} del PDF AD 2.0 vigente."""
    pagina = bajar(f"{BASE}/aip/ad").decode("utf-8", "replace")
    hoy = dt.date.today()
    res = {}
    for fila in re.findall(r"<tr>(.*?)</tr>", pagina, re.S):
        m = re.search(r"([A-Z]{4})-AD-2\.0&nbsp;", fila)
        if not m:
            continue
        mejor = None
        for href, ed, fecha in re.findall(r'href="(/descarga/[^"]+)"[^>]*>\s*(\d+/\d+)\s+(\d{1,2}-[A-Za-z]{3}-\d{2})', fila):
            vig = dt.datetime.strptime(fecha, "%d-%b-%y").date()
            if vig <= hoy and (mejor is None or vig > mejor["vigencia"]):
                mejor = {"url": BASE + href, "edicion": ed, "vigencia": vig}
        if mejor:
            res[m.group(1)] = mejor
    return res


def limpiar(c) -> str:
    c = (c or "").replace("\n", " ")
    c = c.replace("�", "")
    return re.sub(r"\s+", " ", html.unescape(c)).strip()


def filas_de_tabla(tabla) -> list[list[str]]:
    """
    Usa la fila de números de columna (1, 2, 3...) del AIP para saber dónde está cada columna real, y ubica
    cada celda de datos en la columna cuyo número le queda más cerca horizontalmente (las tablas del PDF
    vienen con celdas partidas que no coinciden con el encabezado).
    """
    textos = tabla.extract()
    for i, f in enumerate(textos):
        nums = [(j, limpiar(c)) for j, c in enumerate(f) if limpiar(c).isdigit()]
        if len(nums) >= 4 and [n for _, n in nums] == [str(k) for k in range(1, len(nums) + 1)]:
            celdas_enc = tabla.rows[i].cells
            bordes = [celdas_enc[j][0] for j, _ in nums]
            datos = []
            for fi in range(i + 1, len(textos)):
                fila = [""] * len(bordes)
                for j, c in enumerate(textos[fi]):
                    txt, caja = limpiar(c), tabla.rows[fi].cells[j]
                    if not txt or caja is None:
                        continue
                    # columna: la del número de encabezado cuyo borde izquierdo está más cerca
                    k = min(range(len(bordes)), key=lambda n: abs(bordes[n] - caja[0]))
                    fila[k] = (fila[k] + " " + txt).strip()
                if any(fila):
                    datos.append(fila)
            return datos
    return []


def unir_continuaciones(filas: list[list[str]]) -> list[list[str]]:
    """Las filas que no traen el tipo de servicio/ayuda continúan la anterior: se heredan las celdas vacías."""
    out = []
    for f in filas:
        if out and not f[0]:
            if f[2].upper().startswith("EMERG"):
                # la frecuencia de emergencia figura como canal, pero no pertenece al servicio de arriba
                f = ["EMERG", "", ""] + f[3:]
            else:
                # sin servicio/ayuda propio: es otra frecuencia del mismo servicio (CPPL, CAUX...)
                f = [c or (out[-1][k] if k < 2 else "") for k, c in enumerate(f)]
        out.append(f)
    return out


def extraer(pdf: bytes) -> dict:
    doc = pymupdf.open(stream=pdf, filetype="pdf")
    ats, ayudas, airac = [], [], None
    for p in doc:
        t = p.get_text()
        m = re.search(r"AMDT AIRAC\s+(\d+/\d{4})", t)
        if m and not airac:
            airac = m.group(1)
        if "ATS COMMUNICATION FACILITIES" not in t and "NAVIGATIONAL AND LANDING AIDS" not in t:
            continue
        for tb in p.find_tables().tables:
            enc = " ".join(limpiar(c) for c in (tb.extract() or [[""]])[0])
            filas = filas_de_tabla(tb)
            if "2.18" in enc or "COMUNICACIONES" in enc.upper():
                for f in unir_continuaciones(filas):
                    if len(f) >= 4 and re.search(r"\d{3}[.,]\d+\s*MHz", f[3]):
                        ats.append({"servicio": f[0], "distintivo": f[1], "canal": f[2], "frecuencia": f[3], "horario": f[4] if len(f) > 4 else "", "observaciones": f[5] if len(f) > 5 else ""})
            elif "2.19" in enc or "RADIOAYUDAS" in enc.upper():
                for f in unir_continuaciones(filas):
                    if len(f) >= 3 and re.search(r"(MHz|KHz|kHz|CH\s*\d+)", f[2]):
                        ayudas.append({"tipo": f[0], "id": f[1], "frecuencia": f[2], "horario": f[3] if len(f) > 3 else "", "observaciones": f[6] if len(f) > 6 else ""})
    return {"ats": ats, "radioayudas": ayudas, "airac": airac}


def main():
    ediciones = ediciones_ad20()
    print(f"{len(ediciones)} aeródromos en el AIP", file=sys.stderr)
    aerodromos, errores = {}, {}
    for icao, ed in sorted(ediciones.items()):
        try:
            datos = extraer(bajar(ed["url"]))
            if not datos["ats"] and not datos["radioayudas"]:
                errores[icao] = "No se encontraron las tablas AD 2.18 / 2.19"
                continue
            aerodromos[icao] = {
                "documento": f"AIP Argentina, {icao} AD 2.0 (edición {ed['edicion']}, vigente desde {ed['vigencia'].isoformat()})",
                "url": ed["url"],
                "airac": datos["airac"],
                "ats": datos["ats"],
                "radioayudas": datos["radioayudas"],
            }
            print(f"{icao}: {len(datos['ats'])} ATS, {len(datos['radioayudas'])} radioayudas", file=sys.stderr)
        except Exception as e:  # noqa: BLE001 — se registra y se sigue con el próximo
            errores[icao] = str(e)
    SALIDA.write_text(
        json.dumps({"extraido": dt.date.today().isoformat(), "fuente": f"{BASE}/aip", "aerodromos": aerodromos, "errores": errores}, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    print(f"Listo: {len(aerodromos)} aeródromos, {len(errores)} con error → {SALIDA}", file=sys.stderr)


if __name__ == "__main__":
    main()
