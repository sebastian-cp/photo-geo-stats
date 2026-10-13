"use client";

import { forwardRef } from "react";
import land from "@/data/land-dots.json";
import { fill, type Dict } from "@/i18n/dict";
import type { Profile } from "@/lib/profile";
import type { Stats } from "@/lib/stats";
import type { Photo } from "@/lib/types";
import { Icon } from "./Icon";

export type CardFormat = "story" | "post";

/** Tamaño base en CSS; se exporta ×3 (1080×1920 y 1080×1350). */
export const CARD_SIZE: Record<CardFormat, { w: number; h: number }> = {
  story: { w: 360, h: 640 },
  post: { w: 360, h: 450 },
};

export const SITE = "github.com/sebastian-cp/photo-geo-stats";

const PROFILE_ICON: Record<Profile["kind"], string> = {
  golden: "🌅",
  night: "🌙",
  early: "🌤️",
  bokeh: "✨",
  pocket: "📱",
  globetrotter: "🧭",
  explorer: "📷",
};

/** Hasta 4 fotos con miniatura, una por país primero para que el collage muestre variedad. */
export function pickCollage(photos: Photo[], max = 4) {
  const withThumb = photos.filter((p) => p.thumb);
  const picked: Photo[] = [];
  const countries = new Set<string>();
  for (const p of withThumb) {
    if (picked.length >= max) break;
    const key = p.country ?? `?${p.id}`;
    if (!countries.has(key)) {
      countries.add(key);
      picked.push(p);
    }
  }
  for (const p of withThumb) {
    if (picked.length >= max) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked;
}

function DotMap({ photos }: { photos: Photo[] }) {
  const { cols, rows, latTop, latBottom, dots } = land;
  const located = photos.filter((p) => p.lat != null && p.lng != null && p.lat <= latTop && p.lat >= latBottom);
  return (
    <svg viewBox={`0 0 ${cols} ${rows}`} className="block w-full" aria-hidden="true">
      {dots.map(([c, r]) => (
        <circle key={`${c}-${r}`} cx={c + 0.5} cy={r + 0.5} r={0.3} fill="#fff" opacity={0.75} />
      ))}
      {located.map((p) => {
        const cx = ((p.lng! + 180) / 360) * cols;
        const cy = ((latTop - p.lat!) / (latTop - latBottom)) * rows;
        return (
          <g key={p.id}>
            <circle cx={cx} cy={cy} r={1.6} fill="#f0643c" opacity={0.22} />
            <circle cx={cx} cy={cy} r={0.75} fill="#f0643c" stroke="#fff" strokeWidth={0.25} />
          </g>
        );
      })}
    </svg>
  );
}

type Props = {
  format: CardFormat;
  title: string;
  photos: Photo[];
  stats: Stats;
  profile: Profile;
  onlyCountries: boolean;
  lang: string;
  t: Dict;
};

export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard({ format, title, photos, stats, profile, onlyCountries, lang, t }, ref) {
  const { w, h } = CARD_SIZE[format];
  const story = format === "story";
  const collage = pickCollage(photos, story ? 4 : 3);
  const regionName = new Intl.DisplayNames([lang], { type: "region" });

  const places = onlyCountries
    ? stats.countries.map((c) => regionName.of(c) ?? c)
    : [...new Set(photos.filter((p) => p.city).map((p) => p.city!))];
  const shownPlaces = places.slice(0, story ? 6 : 4);
  const morePlaces = places.length - shownPlaces.length;

  const pct = Math.round(profile.value * 100);
  const prof = t.share.profile[profile.kind];

  return (
    <div
      ref={ref}
      style={{ width: w, height: h, background: "linear-gradient(160deg,#ffe8d6 0%,#fbd5e0 50%,#e3dcff 100%)", fontFamily: "var(--font-jakarta), system-ui, sans-serif" }}
      className="relative flex flex-col overflow-hidden px-6 pt-6 pb-4 text-ink"
    >
      <div className="flex items-center gap-1 text-[10px] leading-none font-bold uppercase tracking-[0.14em] text-accent">
        <Icon name="pin" className="h-3 w-3" /> photo-geo-stats
      </div>
      <h2 className="mt-1 text-[26px] leading-tight font-extrabold tracking-tight break-words">{title}</h2>

      <div className={story ? "mt-4" : "mt-2"}>
        <DotMap photos={photos} />
      </div>

      {collage.length > 0 && (
        <div className={`flex justify-center ${story ? "mt-5 gap-2" : "mt-3 gap-2"}`}>
          {collage.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={p.thumb}
              alt=""
              style={{ transform: `rotate(${[-5, 4, -3, 6][i]}deg)` }}
              className={`${story ? "h-[88px] w-[72px]" : "h-[70px] w-[62px]"} rounded-[4px] border-[3px] border-b-[10px] border-white object-cover shadow-[0_6px_14px_rgba(120,60,90,0.25)]`}
            />
          ))}
        </div>
      )}

      <div className={`grid grid-cols-3 rounded-2xl bg-white/65 text-center ${story ? "mt-6 py-3" : "mt-4 py-2"}`}>
        {[
          [stats.total, t.panel.photos],
          [stats.countries.length, t.panel.countries],
          [stats.cities, t.panel.cities],
        ].map(([v, label]) => (
          <div key={label}>
            <div className="text-[22px] leading-none font-extrabold">{v}</div>
            <div className="mt-1 text-[10px] text-muted">{label}</div>
          </div>
        ))}
      </div>

      <div className={`flex items-center gap-3 rounded-2xl bg-white/65 px-3 ${story ? "mt-3 py-3" : "mt-2 py-2"}`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl" style={{ background: "linear-gradient(135deg,#f0643c,#e2589a)" }}>
          {PROFILE_ICON[profile.kind]}
        </span>
        <div className="min-w-0">
          <div className="text-[14px] leading-tight font-bold">{prof.name}</div>
          <div className="mt-0.5 text-[10px] leading-snug text-muted">{fill(prof.detail, { pct, n: profile.value })}</div>
        </div>
      </div>

      {story && shownPlaces.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">{t.share.places}</div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {shownPlaces.map((p) => (
              <span key={p} className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold">{p}</span>
            ))}
            {morePlaces > 0 && <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-muted">+{morePlaces}</span>}
          </div>
        </div>
      )}

      <div className="mt-auto pt-2 text-center text-[9px] font-semibold text-muted">{SITE}</div>
    </div>
  );
});
