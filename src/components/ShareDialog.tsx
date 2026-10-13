"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { domToBlob } from "modern-screenshot";
import type { Dict } from "@/i18n/dict";
import { photographerProfile } from "@/lib/profile";
import { computeStats } from "@/lib/stats";
import type { Photo } from "@/lib/types";
import { Icon } from "./Icon";
import { CARD_SIZE, ShareCard, type CardFormat } from "./ShareCard";

const EXPORT_SCALE = 3;

type Props = { photos: Photo[]; t: Dict; lang: string; onClose: () => void };

export function ShareDialog({ photos, t, lang, onClose }: Props) {
  const stats = useMemo(() => computeStats(photos, t.panel.other, t.panel.unknown), [photos, t]);
  const profile = useMemo(() => photographerProfile(photos, stats), [photos, stats]);
  const [format, setFormat] = useState<CardFormat>("story");
  const [title, setTitle] = useState(t.share.defaultTitle);
  const [onlyCountries, setOnlyCountries] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const previewBox = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const { w, h } = CARD_SIZE[format];
  const cardProps = { format, title: title || t.share.defaultTitle, photos, stats, profile, onlyCountries, lang, t };
  // La vista previa se escala para caber en el espacio libre: así el modal nunca necesita scroll.
  const scale = box.w && box.h ? Math.min(1, box.w / w, box.h / h) : 0;

  useEffect(() => {
    const el = previewBox.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  async function render(): Promise<File | null> {
    if (!card.current) return null;
    setBusy(true);
    setError(false);
    try {
      const blob = await domToBlob(card.current, { scale: EXPORT_SCALE, type: "image/png" });
      return new File([blob], `photo-geo-stats-${format}.png`, { type: "image/png" });
    } catch {
      setError(true);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    const file = await render();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function share() {
    const file = await render();
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: title, text: t.share.shareText });
    } catch {
      // El usuario cerró el menú de compartir: no es un error.
    }
  }

  // El menú nativo con archivos existe sobre todo en celulares; en el computador se descarga.
  const canShare = typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [new File([""], "x.png", { type: "image/png" })] });

  const header = (
    <div className="flex items-center justify-between gap-3">
      <h2 id="share-title" className="text-lg font-extrabold md:text-xl">{t.share.title}</h2>
      <button type="button" onClick={() => dialog.current?.close()} aria-label={t.share.close} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
        <Icon name="close" />
      </button>
    </div>
  );

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && dialog.current.close()}
      className="inset-0 m-0 h-auto max-h-none w-full max-w-none overflow-hidden bg-[#fff8f4] p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm md:m-auto md:h-fit md:max-h-[95dvh] md:w-[min(820px,95vw)] md:rounded-3xl md:border md:border-white md:shadow-2xl"
      aria-labelledby="share-title"
    >
      <div className="flex h-full flex-col gap-3 p-4 md:h-auto md:flex-row md:gap-6 md:p-6">
        <div className="md:hidden">{header}</div>

        <div ref={previewBox} className="flex min-h-0 flex-1 items-center justify-center md:h-[520px] md:w-[300px] md:flex-none">
          {scale > 0 && (
            <div style={{ width: w * scale, height: h * scale }} className="overflow-hidden rounded-2xl shadow-xl">
              <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <ShareCard {...cardProps} />
              </div>
            </div>
          )}
          {/* Copia sin escalar fuera de pantalla: es la que se exporta, porque la captura toma el tamaño visible. */}
          <div aria-hidden="true" style={{ position: "fixed", left: -10000, top: 0 }}>
            <ShareCard ref={card} {...cardProps} />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 md:min-w-0 md:flex-1 md:gap-5">
          <div className="hidden md:block">{header}</div>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{t.share.cardTitle}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={40}
              className="mt-1.5 h-10 w-full rounded-xl border border-ink/10 bg-white px-3 outline-none focus:border-accent"
            />
          </label>

          <div role="radiogroup" aria-label="Formato" className="flex gap-2">
            {(["story", "post"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={format === f}
                onClick={() => setFormat(f)}
                className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm leading-none font-semibold transition ${format === f ? "accent-gradient text-white" : "border border-ink/10 bg-white"}`}
              >
                {t.share[f]} <span className="font-normal opacity-75">{f === "story" ? "9:16" : "4:5"}</span>
              </button>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-3 md:items-start">
            <input type="checkbox" checked={onlyCountries} onChange={(e) => setOnlyCountries(e.target.checked)} className="h-4 w-4 accent-[#f0643c] md:mt-1" />
            <span>
              <span className="block text-sm font-semibold">{t.share.onlyCountries}</span>
              <span className="hidden text-xs text-muted md:block">{t.share.onlyCountriesHint}</span>
            </span>
          </label>

          <div className="mt-auto flex flex-wrap gap-2 md:flex-col md:flex-nowrap">
            {error && <p className="w-full text-sm text-accent" role="alert">{t.share.error}</p>}
            {canShare && (
              <button type="button" onClick={share} disabled={busy} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full accent-gradient px-5 text-sm leading-none font-semibold text-white disabled:opacity-60 md:flex-none">
                <Icon name="share" />
                {busy ? t.share.working : t.share.share}
              </button>
            )}
            <button
              type="button"
              onClick={download}
              disabled={busy}
              className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm leading-none font-semibold disabled:opacity-60 md:flex-none ${canShare ? "border border-ink/10 bg-white" : "accent-gradient text-white"}`}
            >
              <Icon name="download" />
              {busy && !canShare ? t.share.working : t.share.download}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
