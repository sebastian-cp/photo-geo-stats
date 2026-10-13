import { describe, expect, it } from "vitest";
import { fileKey, selectFiles } from "./intake";

const file = (name: string, size = 1, type = "image/jpeg") => ({ name, size, type, lastModified: 0 });

describe("selectFiles", () => {
  it("ignora lo que no es imagen", () => {
    const r = selectFiles([file("a.jpg"), file("notas.pdf", 1, "application/pdf")], new Set());
    expect(r.accepted).toHaveLength(1);
    expect(r.notImage).toBe(1);
  });

  it("acepta HEIC aunque el navegador no informe el tipo", () => {
    expect(selectFiles([file("IMG_1.HEIC", 1, "")], new Set()).accepted).toHaveLength(1);
  });

  it("salta duplicados, también contra lo ya cargado", () => {
    const a = file("a.jpg");
    const r = selectFiles([a, a, file("b.jpg")], new Set([fileKey(file("b.jpg"))]));
    expect(r.accepted).toHaveLength(1);
    expect(r.duplicate).toBe(2);
  });

  it("respeta el tope de 50 contando las ya cargadas", () => {
    const existing = new Set(Array.from({ length: 40 }, (_, i) => `old${i}`));
    const files = Array.from({ length: 20 }, (_, i) => file(`n${i}.jpg`));
    const r = selectFiles(files, existing);
    expect(r.accepted).toHaveLength(10);
    expect(r.overLimit).toBe(10);
  });
});
