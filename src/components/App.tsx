"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { dictionaries, fill, type Locale } from "@/i18n/dict";
import { MAX_PHOTOS } from "@/lib/intake";
import { usePhotos } from "@/lib/usePhotos";
import { useIsAndroid } from "@/lib/useIsAndroid";
import { Home } from "./Home";
import { Icon } from "./Icon";
import { ShareDialog } from "./ShareDialog";
import { SummaryPanel } from "./SummaryPanel";

// MapLibre necesita el navegador: se carga solo en el cliente.
const MapView = dynamic(() => import("./MapView"), { ssr: false });

const REPO_URL = "https://github.com/sebastian-cp/photo-geo-stats";
const AUTHOR_URL = "https://github.com/sebastian-cp";

type Credit = { file: string; title: string; page: string; license: string; artist: string };

export function App({ lang }: { lang: Locale }) {
  const t = dictionaries[lang];
  const { photos, progress, toasts, add, loadSamples, reset, full } = usePhotos(t);
  const input = useRef<HTMLInputElement>(null);
  const [credits, setCredits] = useState<Credit[] | null>(null);
  const [showCredits, setShowCredits] = useState(false);
  const [sharing, setSharing] = useState(false);
  const progressText = progress ? fill(t.progress, progress) : undefined;
  const showResults = photos.length > 0;

  useEffect(() => {
    if (showCredits && !credits) fetch("/samples/credits.json").then((r) => r.json()).then(setCredits).catch(() => setCredits([]));
  }, [showCredits, credits]);

  const choose = () => input.current?.click();
  const other = lang === "es" ? "en" : "es";
  const isAndroid = useIsAndroid();

  return (
    <div
      className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden"
      onDragOver={(e) => showResults && e.preventDefault()}
      onDrop={(e) => {
        if (!showResults) return;
        e.preventDefault();
        add([...e.dataTransfer.files]);
      }}
    >
      <input
        ref={input}
        type="file"
        // En Android, pedir solo imágenes abre la galería, que borra el GPS; sin filtro aparece «Archivos».
        accept={isAndroid ? undefined : "image/*,.heic,.heif"}
        multiple
        hidden
        data-testid="file-input"
        onChange={(e) => {
          add([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      <header className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <span className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-xl accent-gradient text-white">
            <Icon name="pin" className="h-[18px] w-[18px]" />
          </span>
          <span className={showResults ? "hidden sm:inline" : undefined}>photo-geo-stats</span>
        </span>
        <div className="flex items-center gap-2">
          {showResults && (
            <>
              {progressText && <span className="hidden text-sm text-muted sm:inline" aria-live="polite">{progressText}</span>}
              <button
                type="button"
                onClick={() => setSharing(true)}
                disabled={!!progress}
                aria-label={t.share.open}
                title={t.share.open}
                className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-semibold leading-none disabled:opacity-50 accent-gradient text-white shadow-md shadow-accent/25 sm:px-4"
              >
                <Icon name="share" />
                <span className="hidden sm:inline">{t.share.open}</span>
              </button>
              <button
                type="button"
                onClick={choose}
                disabled={full || !!progress}
                title={full ? fill(t.bar.full, { max: MAX_PHOTOS }) : undefined}
                aria-label={t.bar.addLabel}
                className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold leading-none disabled:opacity-50 border border-white bg-white/70"
              >
                <Icon name="plus" />
                {t.bar.add}
              </button>
              <button type="button" onClick={reset} disabled={!!progress} aria-label={t.bar.reset} title={t.bar.reset} className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 sm:px-4 text-sm font-semibold leading-none disabled:opacity-50 border border-white bg-white/70">
                <Icon name="reset" />
                <span className="hidden sm:inline">{t.bar.reset}</span>
              </button>
            </>
          )}
          <Link href={`/${other}`} hrefLang={other} aria-label={`${t.lang.label}: ${t.lang.switchTo}`} className="inline-flex h-9 items-center rounded-full border border-white bg-white/70 px-3 text-xs font-bold uppercase leading-none">
            {other}
          </Link>
        </div>
      </header>

      {showResults ? (
        <main className="grid flex-1 gap-4 px-4 pb-2 sm:px-6 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="h-[60vh] lg:h-full lg:min-h-0">
            <MapView photos={photos} t={t} lang={lang} android={isAndroid} />
          </div>
          <SummaryPanel photos={photos} t={t} lang={lang} />
        </main>
      ) : (
        <Home t={t} onChoose={choose} onSamples={loadSamples} onFiles={add} busy={!!progress} progressText={progressText} />
      )}

      <footer className="px-4 py-2 text-center text-xs text-muted sm:px-6">
        {t.footer.by}{" "}
        <a href={AUTHOR_URL} className="font-semibold text-ink hover:underline">Sebastián Cofré</a> ·{" "}
        <a href={REPO_URL} className="hover:underline">{t.footer.source}</a> ·{" "}
        <button type="button" onClick={() => setShowCredits((v) => !v)} className="hover:underline" aria-expanded={showCredits}>
          {t.footer.credits}
        </button>{" "}
        · {t.footer.geonames}
        {showCredits && (
          <div className="glass fixed inset-x-4 bottom-10 z-40 mx-auto max-h-64 max-w-2xl overflow-auto rounded-2xl p-4 text-left">
            <h2 className="mb-2 font-bold text-ink">{t.footer.creditsTitle}</h2>
            <ul className="space-y-1">
              {credits?.map((c) => (
                <li key={c.file}>
                  <a href={c.page} className="hover:underline" target="_blank" rel="noreferrer">{c.title.replace(/^File:/, "")}</a> — {c.artist || "?"} · {c.license}
                </li>
              ))}
            </ul>
          </div>
        )}
      </footer>

      {sharing && <ShareDialog photos={photos} t={t} lang={lang} onClose={() => setSharing(false)} />}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className="glass rounded-full px-4 py-2 text-sm font-medium shadow-lg">{x.text}</div>
        ))}
      </div>
    </div>
  );
}
