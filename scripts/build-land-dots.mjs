// Genera src/data/land-dots.json: una grilla de puntos sobre tierra firme para el mapa
// mundi punteado de la tarjeta para compartir. Cada punto es [columna, fila].
// Uso: node scripts/build-land-dots.mjs
import { writeFile } from "node:fs/promises";
import { iso1A2Code } from "@rapideditor/country-coder";

const COLS = 96;
const ROWS = 40; // de 60°S a 80°N: la Antártida no aporta a un mapa de viajes
const LAT_TOP = 80;
const LAT_BOTTOM = -60;

const dots = [];
for (let r = 0; r < ROWS; r++) {
  const lat = LAT_TOP - ((r + 0.5) / ROWS) * (LAT_TOP - LAT_BOTTOM);
  for (let c = 0; c < COLS; c++) {
    const lng = -180 + ((c + 0.5) / COLS) * 360;
    if (iso1A2Code([lng, lat], { level: "territory" })) dots.push([c, r]);
  }
}

await writeFile(
  new URL("../src/data/land-dots.json", import.meta.url),
  JSON.stringify({ cols: COLS, rows: ROWS, latTop: LAT_TOP, latBottom: LAT_BOTTOM, dots }),
);
console.log(`${dots.length} puntos de tierra`);
