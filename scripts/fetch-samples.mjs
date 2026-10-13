// Descarga fotos de ejemplo con licencia libre desde Wikimedia Commons,
// solo las que traen GPS y cámara en su EXIF, y las achica conservando el EXIF.
// Uso: node scripts/fetch-samples.mjs
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const OUT = new URL("../public/samples/", import.meta.url);
const UA = "photo-geo-stats/0.1 (https://github.com/sebastian-cp/photo-geo-stats)";
const PLACES = [
  "Valparaíso", "Torres del Paine", "San Pedro de Atacama", "Buenos Aires", "Machu Picchu",
  "Rio de Janeiro", "Mexico City", "New York City street", "Reykjavik", "Lisbon tram",
  "Barcelona", "Rome", "Amsterdam canal", "Istanbul", "Marrakesh", "Cape Town",
  "Kyoto", "Tokyo street", "Bangkok", "Sydney Opera House", "Queenstown New Zealand", "Patagonia",
];
const LICENSE_OK = /^(cc0|cc by(-sa)? ?[0-9.]*|public domain)/i;
const LIMIT = 24;

const api = async (params) => {
  const url = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({ format: "json", origin: "*", ...params });
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
};

const meta = (md, name) => md?.find((m) => m.name === name)?.value;

async function pick(place) {
  const data = await api({
    action: "query",
    generator: "search",
    gsrsearch: `${place} filetype:bitmap filemime:image/jpeg`,
    gsrnamespace: "6",
    gsrlimit: "30",
    prop: "imageinfo",
    iiprop: "url|size|metadata|extmetadata",
  });
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || ii.size > 12e6 || ii.width < 1200) continue;
    const md = ii.metadata;
    if (meta(md, "GPSLatitude") == null || !meta(md, "Model") || !meta(md, "ISOSpeedRatings")) continue;
    const license = ii.extmetadata?.LicenseShortName?.value ?? "";
    if (!LICENSE_OK.test(license)) continue;
    const artist = (ii.extmetadata?.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim();
    return { title: p.title, url: ii.url, page: ii.descriptionurl, license, artist };
  }
  return null;
}

await mkdir(OUT, { recursive: true });
const credits = [];
for (const place of PLACES) {
  if (credits.length >= LIMIT) break;
  try {
    const hit = await pick(place);
    if (!hit) { console.log(`- ${place}: sin candidata`); continue; }
    const res = await fetch(hit.url, { headers: { "User-Agent": UA } });
    const input = Buffer.from(await res.arrayBuffer());
    const file = `sample-${String(credits.length + 1).padStart(2, "0")}.jpg`;
    // keepExif conserva GPS, cámara y ajustes; se quita el perfil ICC grande y la miniatura original.
    const out = await sharp(input).rotate().resize({ width: 1280, withoutEnlargement: true }).keepExif().jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    await writeFile(new URL(file, OUT), out);
    credits.push({ file, place, ...hit });
    console.log(`+ ${place}: ${hit.title} (${(out.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.log(`! ${place}: ${e.message}`);
  }
}
await writeFile(new URL("credits.json", OUT), JSON.stringify(credits, null, 2) + "\n");
console.log(`\n${credits.length} fotos guardadas en public/samples/`);
