"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fill, type Dict } from "@/i18n/dict";
import { MAX_PHOTOS, fileKey, selectFiles } from "./intake";
import type { Photo, WorkerResponse } from "./types";

export type Toast = { id: number; text: string };

const SAMPLE_COUNT = 20;
const sampleUrl = (i: number) => `/samples/sample-${String(i).padStart(2, "0")}.jpg`;

/** Estado de las fotos cargadas: las procesa en un worker y avisa con notificaciones. */
export function usePhotos(t: Dict) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const keys = useRef(new Set<string>());
  const worker = useRef<Worker | null>(null);
  const pending = useRef(new Map<string, (r: WorkerResponse) => void>());

  useEffect(() => {
    const w = new Worker(new URL("./photo.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      pending.current.get(data.id)?.(data);
      pending.current.delete(data.id);
    };
    worker.current = w;
    return () => w.terminate();
  }, []);

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, text }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 5000);
  }, []);

  const parse = (id: string, file: File) =>
    new Promise<WorkerResponse>((resolve) => {
      pending.current.set(id, resolve);
      worker.current!.postMessage({ id, file });
    });

  const add = useCallback(
    async (input: File[]) => {
      if (!worker.current || progress) return;
      const { accepted, notImage, duplicate, overLimit } = selectFiles(input, keys.current);
      if (notImage) toast(fill(t.toast.notImage, { n: notImage }));
      if (duplicate) toast(fill(t.toast.duplicate, { n: duplicate }));
      if (overLimit) toast(fill(t.toast.overLimit, { max: MAX_PHOTOS, added: accepted.length, total: accepted.length + overLimit }));
      if (!accepted.length) return;

      setProgress({ done: 0, total: accepted.length });
      let failed = 0;
      // Una a la vez: con fotos de 20-40 MB, procesarlas en paralelo dispara la memoria.
      for (const [i, file] of accepted.entries()) {
        const key = fileKey(file);
        keys.current.add(key);
        const res = await parse(key, file);
        if (res.ok) {
          const { thumbBlob, ...data } = res.photo;
          const photo: Photo = { ...data, id: key, name: file.name, thumb: thumbBlob ? URL.createObjectURL(thumbBlob) : undefined };
          setPhotos((ps) => [...ps, photo]);
        } else {
          failed++;
          keys.current.delete(key);
        }
        setProgress({ done: i + 1, total: accepted.length });
      }
      setProgress(null);
      if (failed) toast(fill(t.toast.failed, { n: failed }));
      if (!overLimit && accepted.length - failed > 0) toast(fill(t.toast.added, { n: accepted.length - failed }));
    },
    [progress, t, toast],
  );

  const loadSamples = useCallback(async () => {
    const files = await Promise.all(
      Array.from({ length: SAMPLE_COUNT }, async (_, i) => {
        const url = sampleUrl(i + 1);
        const blob = await fetch(url).then((r) => r.blob());
        return new File([blob], url.split("/").pop()!, { type: "image/jpeg", lastModified: 0 });
      }),
    );
    await add(files);
  }, [add]);

  const reset = useCallback(() => {
    setPhotos((ps) => {
      for (const p of ps) if (p.thumb) URL.revokeObjectURL(p.thumb);
      return [];
    });
    keys.current.clear();
  }, []);

  return { photos, progress, toasts, add, loadSamples, reset, full: photos.length >= MAX_PHOTOS };
}
