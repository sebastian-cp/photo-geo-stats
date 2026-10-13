"use client";

import { useState } from "react";
import { fill, type Dict } from "@/i18n/dict";
import { MAX_PHOTOS } from "@/lib/intake";
import { Icon } from "./Icon";

// Posición, duración y retraso de cada foto del fondo, repartidas para que no se amontonen.
const FLOATERS = [
  { n: 1, left: 3, dur: 28, delay: 0, top: 8 },
  { n: 5, left: 16, dur: 34, delay: -14, top: 62 },
  { n: 9, left: 29, dur: 30, delay: -7, top: 30 },
  { n: 12, left: 42, dur: 36, delay: -22, top: 75 },
  { n: 14, left: 56, dur: 29, delay: -3, top: 12 },
  { n: 15, left: 69, dur: 33, delay: -18, top: 55 },
  { n: 18, left: 82, dur: 27, delay: -10, top: 22 },
  { n: 7, left: 91, dur: 35, delay: -26, top: 70 },
  { n: 11, left: 8, dur: 31, delay: -20, top: 40 },
  { n: 16, left: 74, dur: 32, delay: -5, top: 85 },
];

type Props = { t: Dict; onChoose: () => void; onSamples: () => void; onFiles: (f: File[]) => void; busy: boolean; progressText?: string };

export function Home({ t, onChoose, onSamples, onFiles, busy, progressText }: Props) {
  const [over, setOver] = useState(false);

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {FLOATERS.map((f, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={`/samples/floaters/sample-${String(f.n).padStart(2, "0")}.jpg`}
            alt=""
            className="floater"
            style={{ left: `${f.left}%`, "--dur": `${f.dur}s`, "--delay": `${f.delay}s`, "--still-top": `${f.top}%`, "--r1": `${i % 2 ? 5 : -6}deg`, "--r2": `${i % 2 ? -4 : 6}deg` } as React.CSSProperties}
          />
        ))}
      </div>

      <section className="glass relative z-10 w-full max-w-xl rounded-[28px] px-6 py-8 text-center sm:px-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.home.title}</h1>
        <p className="mt-2 text-muted">{t.home.lead}</p>

        <div
          role="button"
          tabIndex={0}
          onClick={onChoose}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onChoose())}
          onDragOver={(e) => (e.preventDefault(), setOver(true))}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            onFiles([...e.dataTransfer.files]);
          }}
          className={`mt-6 cursor-pointer rounded-3xl border-2 border-dashed px-4 py-8 font-semibold transition ${
            over ? "scale-[1.02] border-accent bg-accent-soft text-accent" : "border-accent/50 bg-white/50 text-accent hover:bg-accent-soft/70"
          }`}
        >
          <Icon name="upload" className="mx-auto h-8 w-8" />
          <div className="mt-2">{busy && progressText ? progressText : over ? t.home.dropActive : t.home.drop}</div>
          <div className="mt-1 text-xs font-normal text-muted">{fill(t.home.limit, { max: MAX_PHOTOS })}</div>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onChoose} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-full accent-gradient px-6 text-sm leading-none font-semibold text-white shadow-lg shadow-accent/25 transition hover:brightness-105 disabled:opacity-60">
            {t.home.choose}
          </button>
          <button type="button" onClick={onSamples} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-full border border-white bg-white/80 px-6 text-sm leading-none font-semibold transition hover:bg-white disabled:opacity-60">
            {t.home.samples}
          </button>
        </div>

        <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted">
          <Icon name="lock" className="h-3.5 w-3.5" />
          {t.home.privacy}
        </p>
      </section>
    </main>
  );
}
