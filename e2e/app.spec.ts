import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const summary = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Tu resumen" });

test("la raíz redirige según el idioma del navegador", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.getByRole("heading", { name: "Tus fotos, en el mapa" })).toBeVisible();
});

test("probar con ejemplos llena el mapa y el resumen", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: "Probar con ejemplos" }).click();
  await expect(summary(page).getByText("20", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".pin-photo, .pin-cluster").first()).toBeVisible();
  await expect(page.getByText("Se agregaron 20 fotos")).toBeVisible();
});

test("tocar un pin abre el globo con los datos de la foto", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: "Probar con ejemplos" }).click();
  await page.getByRole("button", { name: "Cape Town, Sudáfrica" }).click();
  const popup = page.locator(".maplibregl-popup");
  await expect(popup).toContainText("Cape Town, Sudáfrica");
  await expect(popup).toContainText("ISO 320");
});

test("con 55 fotos solo entran 50", async ({ page }) => {
  await page.goto("/es");
  const buffer = readFileSync("public/samples/sample-01.jpg");
  const files = Array.from({ length: 55 }, (_, i) => ({ name: `foto-${i}.jpg`, mimeType: "image/jpeg", buffer }));
  await page.getByTestId("file-input").setInputFiles(files);
  await expect(page.getByText("se agregaron 50 de 55")).toBeVisible({ timeout: 45_000 });
  await expect(summary(page).getByText("50", { exact: true })).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole("button", { name: "Agregar fotos" })).toBeDisabled();
});

test("el selector cambia a inglés", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("link", { name: /Idioma/ }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("heading", { name: "Your photos, on the map" })).toBeVisible();
});

test("compartir genera una imagen PNG de 1080×1920", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: "Probar con ejemplos" }).click();
  await expect(summary(page).getByText("20", { exact: true })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Compartir", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Comparte tus viajes" })).toBeVisible();
  await expect(page.getByText("Trotamundos").first()).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Descargar PNG" }).click()]);
  const path = test.info().outputPath("story.png");
  await download.saveAs(path);
  const png = readFileSync(path);
  // Ancho y alto vienen en el encabezado IHDR del PNG.
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1080, 1920]);
});

test.describe("en Android", () => {
  test.use({ userAgent: "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36" });

  test("el selector no filtra por imágenes y explica cómo recuperar el GPS", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByTestId("file-input")).not.toHaveAttribute("accept");
    await page.getByTestId("file-input").setInputFiles("e2e/fixtures/sin-gps.jpg");
    await expect(page.getByText("Android ocultó la ubicación de tus fotos")).toBeVisible({ timeout: 20_000 });
  });
});

test("muestra los kilómetros recorridos", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("button", { name: "Probar con ejemplos" }).click();
  await expect(summary(page).getByText("km recorridos")).toBeVisible({ timeout: 30_000 });
});
