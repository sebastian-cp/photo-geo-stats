import type { Photo } from "./types";

export type Bucket = { label: string; count: number };
export type Share = { label: string; count: number; pct: number };
export type DayPart = "morning" | "afternoon" | "golden" | "night";

export type Stats = {
  total: number;
  withGps: number;
  countries: string[];
  cities: number;
  cameras: Share[];
  iso: { top?: number; buckets: Bucket[] };
  aperture: { top?: number; buckets: Bucket[] };
  shutter: { top?: number; buckets: Bucket[] };
  dayParts: Record<DayPart, number>;
  noGps: Photo[];
};

/** Valor más repetido; en empate gana el que apareció primero. */
export function mode(values: number[]): number | undefined {
  const counts = new Map<number, number>();
  let best: number | undefined;
  for (const v of values) {
    const n = (counts.get(v) ?? 0) + 1;
    counts.set(v, n);
    if (best === undefined || n > counts.get(best)!) best = v;
  }
  return best;
}

/** Cuenta valores en tramos: `edges` son los límites superiores (exclusivos), el último tramo es abierto. */
export function histogram(values: number[], edges: number[], labels: string[]): Bucket[] {
  const buckets = labels.map((label) => ({ label, count: 0 }));
  for (const v of values) {
    const i = edges.findIndex((e) => v < e);
    buckets[i === -1 ? edges.length : i].count++;
  }
  return buckets;
}

/** 1/250 para 0.004; 2s para 2. */
export function formatShutter(seconds: number) {
  if (seconds >= 1) return `${Math.round(seconds * 10) / 10}s`;
  return `1/${Math.round(1 / seconds)}`;
}

/** Franja del día según la hora local de la cámara. La hora dorada es la primera y última luz. */
export function dayPart(hour: number): DayPart {
  if (hour === 6 || hour === 7 || (hour >= 17 && hour <= 19)) return "golden";
  if (hour >= 8 && hour <= 11) return "morning";
  if (hour >= 12 && hour <= 16) return "afternoon";
  return "night";
}

const OTHER_CAMERAS = 4;

export function computeStats(photos: Photo[], otherLabel = "Otras", unknownLabel = "Desconocida"): Stats {
  const located = photos.filter((p) => p.lat != null && p.lng != null);
  const countries = [...new Set(located.map((p) => p.country).filter((c): c is string => !!c))];
  const cities = new Set(located.filter((p) => p.city).map((p) => `${p.country}|${p.city}`)).size;

  const camCounts = new Map<string, number>();
  for (const p of photos) camCounts.set(p.camera ?? unknownLabel, (camCounts.get(p.camera ?? unknownLabel) ?? 0) + 1);
  const sorted = [...camCounts].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, OTHER_CAMERAS);
  const rest = sorted.slice(OTHER_CAMERAS).reduce((s, [, n]) => s + n, 0);
  if (rest) top.push([otherLabel, rest]);
  const cameras = top.map(([label, count]) => ({ label, count, pct: Math.round((count / (photos.length || 1)) * 100) }));

  const isos = photos.flatMap((p) => (p.iso ? [p.iso] : []));
  const fs = photos.flatMap((p) => (p.fNumber ? [p.fNumber] : []));
  const ts = photos.flatMap((p) => (p.exposure ? [p.exposure] : []));

  const dayParts: Record<DayPart, number> = { morning: 0, afternoon: 0, golden: 0, night: 0 };
  for (const p of photos) {
    if (!p.takenAt) continue;
    dayParts[dayPart(Number(p.takenAt.slice(11, 13)))]++;
  }

  return {
    total: photos.length,
    withGps: located.length,
    countries,
    cities,
    cameras,
    iso: { top: mode(isos), buckets: histogram(isos, [150, 300, 600, 1200, 2400], ["≤100", "200", "400", "800", "1600", "3200+"]) },
    aperture: { top: mode(fs), buckets: histogram(fs, [2.8, 4, 5.6, 8, 11], ["<2.8", "2.8", "4", "5.6", "8", "11+"]) },
    shutter: {
      top: mode(ts),
      buckets: histogram(ts, [1 / 1000, 1 / 250, 1 / 60, 1 / 15], ["1/1000+", "1/250", "1/60", "1/15", "≥1/15"]),
    },
    dayParts,
    noGps: photos.filter((p) => p.lat == null || p.lng == null),
  };
}
