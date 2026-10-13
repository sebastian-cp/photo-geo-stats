import { describe, expect, it } from "vitest";
import { reverseGeocode } from "./geocode";

describe("reverseGeocode", () => {
  it.each([
    [-33.04, -71.63, "CL", "Valparaíso"],
    [-13.16, -72.54, "PE", undefined],
    [41.4, 2.17, "ES", "Barcelona"],
    [40.75, -73.99, "US", "New York City"],
  ])("%f, %f → %s", (lat, lng, country, city) => {
    const r = reverseGeocode(lat, lng);
    expect(r.country).toBe(country);
    if (city) expect(r.city).toBe(city);
  });

  it("en medio del océano no hay país ni ciudad", () => {
    expect(reverseGeocode(-40, -130)).toEqual({ country: undefined, city: undefined });
  });
});
