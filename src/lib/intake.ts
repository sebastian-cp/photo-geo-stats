export const MAX_PHOTOS = 50;

const ACCEPTED = /\.(jpe?g|heic|heif|png|webp)$/i;

type FileLike = Pick<File, "name" | "size" | "lastModified" | "type">;

export const fileKey = (f: FileLike) => `${f.name}|${f.size}|${f.lastModified}`;

export const isAcceptedImage = (f: FileLike) => f.type.startsWith("image/") || ACCEPTED.test(f.name);

/**
 * Decide qué archivos entran: solo imágenes, sin duplicados y sin pasar el tope total.
 * `existing` son las claves de las fotos ya cargadas.
 */
export function selectFiles<T extends FileLike>(files: T[], existing: ReadonlySet<string>, max = MAX_PHOTOS) {
  const accepted: T[] = [];
  let notImage = 0;
  let duplicate = 0;
  let overLimit = 0;
  const seen = new Set(existing);
  for (const f of files) {
    if (!isAcceptedImage(f)) { notImage++; continue; }
    const key = fileKey(f);
    if (seen.has(key)) { duplicate++; continue; }
    if (seen.size >= max) { overLimit++; continue; }
    seen.add(key);
    accepted.push(f);
  }
  return { accepted, notImage, duplicate, overLimit };
}
