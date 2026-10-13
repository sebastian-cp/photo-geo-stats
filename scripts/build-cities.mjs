// Genera src/data/cities.json desde GeoNames (cities15000, CC BY 4.0):
// ciudades de 15.000+ habitantes como [nombre, lat, lng, códigoPaís, población].
// Se excluyen los barrios (PPLX) para que "Times Square" no gane a "New York City".
// Uso: node scripts/build-cities.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

const URL_ZIP = "https://download.geonames.org/export/dump/cities15000.zip";
const res = await fetch(URL_ZIP);
if (!res.ok) throw new Error(`GeoNames ${res.status}`);
const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
const tsv = strFromU8(files["cities15000.txt"]);

const round = (n) => Math.round(Number(n) * 1000) / 1000;
const cities = tsv
  .split("\n")
  .filter(Boolean)
  .map((line) => line.split("\t"))
  .filter((c) => c[7] !== "PPLX")
  .map((c) => [c[1], round(c[4]), round(c[5]), c[8], Number(c[14])]);

const out = new URL("../src/data/", import.meta.url);
await mkdir(out, { recursive: true });
await writeFile(new URL("cities.json", out), JSON.stringify(cities));
console.log(`${cities.length} ciudades`);
