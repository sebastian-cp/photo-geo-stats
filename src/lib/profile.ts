import type { Stats } from "./stats";
import type { Photo } from "./types";

export type ProfileKind = "golden" | "night" | "globetrotter" | "bokeh" | "pocket" | "early" | "explorer";

export type Profile = {
  kind: ProfileKind;
  /** Proporción (0-1) que respalda el perfil; para "globetrotter" es la cantidad de países. */
  value: number;
};

const PHONE = /iphone|pixel|galaxy|samsung|xiaomi|redmi|poco|huawei|honor|oneplus|motorola|moto |oppo|vivo|realme|nothing phone/i;

export const isPhone = (camera?: string) => !!camera && PHONE.test(camera);

/**
 * Elige el rasgo más marcado de las fotos. Cada candidato tiene un umbral mínimo y
 * gana el que más lo supera; si ninguno llega, el perfil es "explorer".
 */
export function photographerProfile(photos: Photo[], stats: Stats): Profile {
  const n = photos.length;
  if (!n) return { kind: "explorer", value: 0 };

  const dated = Object.values(stats.dayParts).reduce((a, b) => a + b, 0) || 1;
  const share = (count: number, total = n) => count / total;
  const withF = photos.filter((p) => p.fNumber);
  const withCamera = photos.filter((p) => p.camera);

  const candidates: { kind: ProfileKind; value: number; min: number }[] = [
    { kind: "golden", value: share(stats.dayParts.golden, dated), min: 0.35 },
    { kind: "night", value: share(stats.dayParts.night, dated), min: 0.3 },
    { kind: "early", value: share(stats.dayParts.morning, dated), min: 0.45 },
    { kind: "bokeh", value: withF.length ? share(withF.filter((p) => p.fNumber! <= 2).length, withF.length) : 0, min: 0.5 },
    { kind: "pocket", value: withCamera.length ? share(withCamera.filter((p) => isPhone(p.camera)).length, withCamera.length) : 0, min: 0.6 },
  ];

  let best: Profile & { score: number } = { kind: "explorer", value: 0, score: 0 };
  for (const c of candidates) {
    const score = c.value / c.min;
    if (score >= 1 && score > best.score) best = { kind: c.kind, value: c.value, score };
  }
  // Cinco países o más pesa más que cualquier hábito: es lo que más luce en una tarjeta de viajes.
  if (stats.countries.length >= 5) return { kind: "globetrotter", value: stats.countries.length };
  return { kind: best.kind, value: best.value };
}
