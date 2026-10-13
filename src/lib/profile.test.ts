import { describe, expect, it } from "vitest";
import { isPhone, photographerProfile } from "./profile";
import { computeStats } from "./stats";
import type { Photo } from "./types";

let id = 0;
const photo = (p: Partial<Photo>): Photo => ({ id: String(id++), name: "x.jpg", ...p });
const profileOf = (photos: Photo[]) => photographerProfile(photos, computeStats(photos));

describe("photographerProfile", () => {
  it("sin fotos es explorador", () => expect(profileOf([]).kind).toBe("explorer"));

  it("cinco países o más es trotamundos", () => {
    const photos = ["CL", "AR", "PE", "BR", "MX"].map((country) => photo({ lat: 1, lng: 1, country, takenAt: "2024-01-01T18:00" }));
    expect(profileOf(photos)).toEqual({ kind: "globetrotter", value: 5 });
  });

  it("mayoría en hora dorada", () => {
    const photos = ["18:10", "19:00", "06:30", "13:00"].map((h) => photo({ takenAt: `2024-01-01T${h}` }));
    expect(profileOf(photos).kind).toBe("golden");
  });

  it("mayoría de noche", () => {
    const photos = ["22:00", "23:30", "01:00", "13:00"].map((h) => photo({ takenAt: `2024-01-01T${h}` }));
    expect(profileOf(photos).kind).toBe("night");
  });

  it("aperturas muy abiertas", () => {
    const photos = [1.4, 1.8, 2, 8].map((fNumber) => photo({ fNumber }));
    expect(profileOf(photos).kind).toBe("bokeh");
  });

  it("casi todo con celular", () => {
    const photos = ["iPhone 15 Pro", "iPhone 15 Pro", "Pixel 8", "Canon EOS R6"].map((camera) => photo({ camera }));
    expect(profileOf(photos).kind).toBe("pocket");
  });

  it("sin rasgo marcado queda como explorador", () => {
    const photos = ["09:00", "13:00", "18:00", "22:00"].map((h) => photo({ takenAt: `2024-01-01T${h}`, camera: "Canon EOS R6", fNumber: 8 }));
    expect(profileOf(photos).kind).toBe("explorer");
  });
});

describe("isPhone", () => {
  it.each([["iPhone 15 Pro", true], ["Xiaomi 2306EPN60G", true], ["Canon EOS 5D Mark IV", false], [undefined, false]])("%s → %s", (cam, expected) =>
    expect(isPhone(cam)).toBe(expected),
  );
});
