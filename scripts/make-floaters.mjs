// Miniaturas livianas (sin EXIF) de las fotos de ejemplo para el fondo animado del inicio.
// Uso: node scripts/make-floaters.mjs (después de fetch-samples.mjs)
import { mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";

const SRC = fileURLToPath(new URL("../public/samples/", import.meta.url));
const OUT = join(SRC, "floaters");
await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => f.endsWith(".jpg"));
for (const f of files) {
  await sharp(join(SRC, f)).resize({ width: 320, height: 240, fit: "cover" }).jpeg({ quality: 72, mozjpeg: true }).toFile(join(OUT, f));
}
console.log(`${files.length} miniaturas en public/samples/floaters/`);
