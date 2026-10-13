/// <reference lib="webworker" />
// Lee EXIF, ubica y genera una miniatura de cada foto fuera del hilo principal.
import exifr from "exifr";
import { reverseGeocode } from "./geocode";
import type { ParsedPhoto, WorkerRequest, WorkerResponse } from "./types";

const THUMB_WIDTH = 480;

type Exif = {
  latitude?: number;
  longitude?: number;
  Make?: string;
  Model?: string;
  ISO?: number | number[];
  FNumber?: number;
  ExposureTime?: number;
  DateTimeOriginal?: string;
  CreateDate?: string;
};

/** "2024:03:14 18:42:07" → "2024-03-14T18:42" (hora local de la cámara, sin zona). */
function localDate(raw?: string) {
  const m = raw?.match(/^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}` : undefined;
}

/** "Apple" + "iPhone 15 Pro" → "iPhone 15 Pro"; "Canon" + "Canon EOS R6" → "Canon EOS R6". */
function cameraName(make?: string, model?: string) {
  const mk = make?.replace(/\s*(corporation|imaging company, ltd\.|co\.,? ?ltd\.?)$/i, "").trim();
  const md = model?.trim();
  if (!md) return mk || undefined;
  if (!mk || md.toLowerCase().startsWith(mk.toLowerCase().split(" ")[0]) || mk === "Apple") return md;
  return `${mk} ${md}`;
}

async function thumbnail(file: File): Promise<Blob | undefined> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, THUMB_WIDTH / bitmap.width);
    const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await canvas.convertToBlob({ type: "image/jpeg", quality: 0.8 });
  } catch {
    // HEIC y otros formatos que el navegador no decodifica: probamos la miniatura incrustada en el EXIF.
    const embedded = await exifr.thumbnail(file).catch(() => undefined);
    return embedded ? new Blob([embedded as BlobPart], { type: "image/jpeg" }) : undefined;
  }
}

async function parse(file: File): Promise<ParsedPhoto> {
  const exif: Exif | undefined = await exifr
    .parse(file, {
      gps: true,
      reviveValues: false,
      pick: ["latitude", "longitude", "GPSLatitude", "GPSLongitude", "GPSLatitudeRef", "GPSLongitudeRef", "Make", "Model", "ISO", "FNumber", "ExposureTime", "DateTimeOriginal", "CreateDate"],
    })
    .catch(() => undefined);

  const photo: ParsedPhoto = {
    takenAt: localDate(exif?.DateTimeOriginal ?? exif?.CreateDate),
    camera: cameraName(exif?.Make, exif?.Model),
    iso: Array.isArray(exif?.ISO) ? exif.ISO[0] : exif?.ISO,
    fNumber: exif?.FNumber,
    exposure: exif?.ExposureTime,
  };

  const lat = exif?.latitude;
  const lng = exif?.longitude;
  if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
    Object.assign(photo, { lat, lng }, reverseGeocode(lat!, lng!));
  }

  photo.thumbBlob = await thumbnail(file);
  return photo;
}

self.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  let res: WorkerResponse;
  try {
    const photo = await parse(data.file);
    // Un archivo sin nada legible (ni EXIF ni imagen) se considera dañado.
    const empty = !photo.thumbBlob && !photo.camera && !photo.takenAt && photo.lat == null;
    res = empty ? { id: data.id, ok: false } : { id: data.id, ok: true, photo };
  } catch {
    res = { id: data.id, ok: false };
  }
  self.postMessage(res);
};
