"use client";

import { useMemo, useState } from "react";
import type { Dict } from "@/i18n/dict";
import { computeStats, formatShutter, type Bucket, type DayPart } from "@/lib/stats";
import type { Photo } from "@/lib/types";
import { Icon } from "./Icon";

function Kpi({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-ink/10 pt-4 first:border-t-0 first:pt-3">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-accent">{title}</h3>
      {children}
    </section>
  );
}

/** Mini histograma: barras verticales con la etiqueta debajo. */
function Histogram({ title, top, buckets, t }: { title: string; top?: string; buckets: Bucket[]; t: Dict }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted">
          {top ? <><b className="text-ink">{top}</b> {t.panel.mostUsed}</> : t.panel.none}
        </span>
      </div>
      <div className="mt-2 flex h-12 items-end gap-1" role="img" aria-label={buckets.map((b) => `${b.label}: ${b.count}`).join(", ")}>
        {buckets.map((b) => (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t-md accent-gradient opacity-90" style={{ height: `${Math.max(b.count ? 8 : 2, (b.count / max) * 40)}px`, opacity: b.count ? 0.9 : 0.15 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {buckets.map((b) => (
          <span key={b.label} className="flex-1 text-center text-[10px] text-muted">{b.label}</span>
        ))}
      </div>
    </div>
  );
}

const DAY_ICONS: Record<DayPart, string> = { morning: "🌤️", afternoon: "☀️", golden: "🌅", night: "🌙" };

export function SummaryPanel({ photos, t }: { photos: Photo[]; t: Dict }) {
  const s = useMemo(() => computeStats(photos, t.panel.other, t.panel.unknown), [photos, t]);
  const [showInfo, setShowInfo] = useState(false);
  const totalDay = Object.values(s.dayParts).reduce((a, b) => a + b, 0) || 1;

  return (
    <aside className="glass flex flex-col overflow-hidden rounded-3xl lg:min-h-0" aria-label={t.panel.title}>
      {/* El título y las cifras quedan fijos; solo el detalle hace scroll. */}
      <div className="border-b border-ink/10 px-5 pt-5 pb-4">
        <h2 className="text-lg font-bold">{t.panel.title}</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Kpi value={s.total} label={t.panel.photos} />
          <Kpi value={s.countries.length} label={t.panel.countries} />
          <Kpi value={s.cities} label={t.panel.cities} />
        </div>
      </div>

      <div className="panel-scroll flex flex-col gap-4 px-5 pt-1 pb-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <Section title={t.panel.cameras}>
          <ul className="space-y-2.5">
            {s.cameras.map((c) => (
              <li key={c.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="truncate pr-2">{c.label}</span>
                  <span className="text-muted">{c.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-ink/5">
                  <div className="h-2 rounded-full accent-gradient" style={{ width: `${c.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t.panel.technique}>
          <div className="space-y-4">
            <Histogram title={t.panel.iso} top={s.iso.top ? `ISO ${s.iso.top}` : undefined} buckets={s.iso.buckets} t={t} />
            <Histogram title={t.panel.aperture} top={s.aperture.top ? `f/${s.aperture.top}` : undefined} buckets={s.aperture.buckets} t={t} />
            <Histogram title={t.panel.shutter} top={s.shutter.top ? formatShutter(s.shutter.top) : undefined} buckets={s.shutter.buckets} t={t} />
          </div>
        </Section>

        <Section title={t.panel.time}>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(s.dayParts) as DayPart[]).map((k) => (
              <div key={k} className="rounded-2xl bg-white/60 p-2 text-center">
                <div className="text-lg" aria-hidden="true">{DAY_ICONS[k]}</div>
                <div className="text-sm font-bold">{Math.round((s.dayParts[k] / totalDay) * 100)}%</div>
                <div className="text-[10px] leading-tight text-muted">{t.panel.dayParts[k]}</div>
              </div>
            ))}
          </div>
        </Section>

        {s.noGps.length > 0 && (
          <Section title={`${t.panel.noGps} (${s.noGps.length})`}>
            <button type="button" onClick={() => setShowInfo((v) => !v)} className="mb-2 flex items-start gap-1.5 text-left text-xs text-muted" aria-expanded={showInfo}>
              <Icon name="info" className="mt-px h-3.5 w-3.5" />
              <span className="underline decoration-dotted">{showInfo ? t.panel.noGpsInfo : t.panel.noGpsInfo.split(".")[0] + "…"}</span>
            </button>
            <div className="flex flex-wrap gap-1.5">
              {s.noGps.map((p) =>
                p.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={p.thumb} alt={p.name} title={p.name} className="h-12 w-12 rounded-lg border-2 border-white object-cover" />
                ) : (
                  <span key={p.id} title={p.name} className="grid h-12 w-12 place-items-center rounded-lg border-2 border-white bg-accent-soft text-accent" aria-label={p.name}>
                    <Icon name="camera" className="h-5 w-5" />
                  </span>
                ),
              )}
            </div>
          </Section>
        )}
      </div>
    </aside>
  );
}
