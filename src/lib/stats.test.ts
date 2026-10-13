import { describe, expect, it } from "vitest";
import { computeStats, dayPart, formatShutter, histogram, mode, travelKm } from "./stats";
import type { Photo } from "./types";

const photo = (p: Partial<Photo>): Photo => ({ id: Math.random().toString(), name: "x.jpg", ...p });

describe("mode", () => {
  it("devuelve el valor más repetido", () => expect(mode([100, 200, 200, 400])).toBe(200));
  it("en empate gana el primero", () => expect(mode([400, 100, 400, 100])).toBe(400));
  it("lista vacía da undefined", () => expect(mode([])).toBeUndefined());
});

describe("histogram", () => {
  it("reparte en tramos con el último abierto", () => {
    const b = histogram([1, 5, 10, 99], [5, 10], ["a", "b", "c"]);
    expect(b.map((x) => x.count)).toEqual([1, 1, 2]);
  });
});

describe("formatShutter", () => {
  it("fracciones", () => expect(formatShutter(0.004)).toBe("1/250"));
  it("segundos", () => expect(formatShutter(2)).toBe("2s"));
});

describe("dayPart", () => {
  it.each([
    [6, "golden"], [9, "morning"], [14, "afternoon"], [18, "golden"], [22, "night"], [3, "night"],
  ] as const)("%i h → %s", (h, part) => expect(dayPart(h)).toBe(part));
});

describe("computeStats", () => {
  const photos = [
    photo({ lat: -33, lng: -71, country: "CL", city: "Valparaíso", camera: "iPhone 15", iso: 64, fNumber: 1.8, exposure: 0.004, takenAt: "2024-03-14T18:42" }),
    photo({ lat: -33.4, lng: -70.6, country: "CL", city: "Santiago", camera: "iPhone 15", iso: 64, takenAt: "2024-03-15T09:10" }),
    photo({ lat: 38.7, lng: -9.1, country: "PT", city: "Lisboa", camera: "Sony a6400", iso: 800 }),
    photo({ camera: "iPhone 15", takenAt: "2024-03-16T23:00" }),
  ];
  const s = computeStats(photos);

  it("totales, países y ciudades", () => {
    expect(s.total).toBe(4);
    expect(s.withGps).toBe(3);
    expect(s.countries).toEqual(["CL", "PT"]);
    expect(s.cities).toBe(3);
  });

  it("cámaras ordenadas con porcentaje", () => {
    expect(s.cameras[0]).toEqual({ label: "iPhone 15", count: 3, pct: 75 });
  });

  it("ISO más usado", () => expect(s.iso.top).toBe(64));

  it("franjas del día", () => expect(s.dayParts).toEqual({ morning: 1, afternoon: 0, golden: 1, night: 1 }));

  it("fotos sin GPS van a la bandeja", () => expect(s.noGps).toHaveLength(1));

  it("agrupa cámaras sobrantes en Otras", () => {
    const many = ["A", "B", "C", "D", "E", "F"].map((camera) => photo({ camera }));
    expect(computeStats(many).cameras.at(-1)).toMatchObject({ label: "Otras", count: 2 });
  });
});

describe("travelKm", () => {
  it("suma la distancia entre fotos en orden cronológico", () => {
    // Santiago → Valparaíso → Santiago, desordenadas en la lista: ~100 km por tramo.
    const photos = [
      photo({ lat: -33.45, lng: -70.66, takenAt: "2024-01-03T10:00" }),
      photo({ lat: -33.45, lng: -70.66, takenAt: "2024-01-01T10:00" }),
      photo({ lat: -33.04, lng: -71.62, takenAt: "2024-01-02T10:00" }),
    ];
    const km = travelKm(photos);
    expect(km).toBeGreaterThan(190);
    expect(km).toBeLessThan(210);
  });

  it("sin al menos dos fotos con ubicación es 0", () => {
    expect(travelKm([photo({ lat: 1, lng: 1 }), photo({})])).toBe(0);
  });

  it("computeStats lo incluye", () => {
    expect(computeStats([photo({ lat: 0, lng: 0 }), photo({ lat: 0, lng: 1 })]).km).toBe(111);
  });
});

describe("tramos de velocidad", () => {
  it("1/50 cae en la barra 1/60, la más cercana", () => {
    const b = computeStats([photo({ exposure: 1 / 50 })]).shutter.buckets;
    expect(b.find((x) => x.count)?.label).toBe("1/60");
  });
});
