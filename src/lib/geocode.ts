import { iso1A2Code } from "@rapideditor/country-coder";
import cities from "@/data/cities.json";

type City = [name: string, lat: number, lng: number, country: string, population: number];

// Índice por celdas de 1°×1° para no recorrer las 34 mil ciudades en cada consulta.
const grid = new Map<string, City[]>();
const cell = (lat: number, lng: number) => `${Math.floor(lat)}:${Math.floor(lng)}`;
for (const c of cities as City[]) {
  const k = cell(c[1], c[2]);
  const list = grid.get(k);
  if (list) list.push(c);
  else grid.set(k, [c]);
}

const toRad = (d: number) => (d * Math.PI) / 180;

/** Distancia en km entre dos puntos (haversine). */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const MAX_CITY_KM = 80;
/** Km de ventaja por cada orden de magnitud de población sobre 15.000: una metrópoli a 5 km gana a un suburbio a 2 km. */
const KM_PER_DECADE = 8;

/** Ciudad (15.000+ habitantes) dentro de 80 km, prefiriendo las del mismo país y las grandes. */
export function nearestCity(lat: number, lng: number, country?: string): string | undefined {
  let best: { name: string; d: number; same: boolean } | undefined;
  const baseLat = Math.floor(lat);
  const baseLng = Math.floor(lng);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (const c of grid.get(`${baseLat + dy}:${baseLng + dx}`) ?? []) {
        const km = distanceKm(lat, lng, c[1], c[2]);
        if (km > MAX_CITY_KM) continue;
        const d = km - KM_PER_DECADE * Math.log10(Math.max(c[4], 15000) / 15000);
        const same = !country || c[3] === country;
        if (!best || (same && !best.same) || (same === best.same && d < best.d)) best = { name: c[0], d, same };
      }
    }
  }
  return best?.name;
}

/** País (ISO de dos letras) y ciudad más cercana, sin salir del navegador. */
export function reverseGeocode(lat: number, lng: number) {
  const country = iso1A2Code([lng, lat], { level: "territory" }) ?? undefined;
  return { country, city: nearestCity(lat, lng, country) };
}
