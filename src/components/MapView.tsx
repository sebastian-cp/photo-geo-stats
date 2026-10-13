"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type Map as MlMap, type Marker } from "maplibre-gl";
import Supercluster from "supercluster";
import "maplibre-gl/dist/maplibre-gl.css";
import { fill, type Dict } from "@/i18n/dict";
import { formatShutter } from "@/lib/stats";
import type { Photo } from "@/lib/types";

// Teselas gratuitas y sin token de OpenFreeMap; solo revelan la zona que se está mirando, no las fotos.
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

/** Recolorea el estilo base con la paleta Atardecer. */
function paintSunset(map: MlMap) {
  for (const layer of map.getStyle().layers ?? []) {
    const id = layer.id.toLowerCase();
    try {
      if (layer.type === "background") map.setPaintProperty(layer.id, "background-color", "#fdf1ec");
      else if (layer.type === "fill" && id.includes("water")) map.setPaintProperty(layer.id, "fill-color", "#e4dcf6");
      else if (layer.type === "line" && id.includes("water")) map.setPaintProperty(layer.id, "line-color", "#e4dcf6");
      else if (layer.type === "fill" && /park|landcover|landuse|wood|grass/.test(id)) map.setPaintProperty(layer.id, "fill-color", "#f7e2d8");
      else if (layer.type === "line" && /boundary|admin/.test(id)) map.setPaintProperty(layer.id, "line-color", "#d9b8c8");
      else if (layer.type === "symbol") {
        map.setPaintProperty(layer.id, "text-color", "#7a6380");
        map.setPaintProperty(layer.id, "text-halo-color", "#fff8f4");
      }
    } catch {
      // Capas sin esa propiedad: se dejan como vienen.
    }
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

type Props = { photos: Photo[]; t: Dict; lang: string; android?: boolean };

export default function MapView({ photos, t, lang, android }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const located = useMemo(() => photos.filter((p) => p.lat != null && p.lng != null), [photos]);
  const fittedCount = useRef(0);

  // Crear el mapa (y recrearlo al reintentar).
  useEffect(() => {
    if (!container.current) return;
    setFailed(false);
    setReady(false);
    const m = new maplibregl.Map({
      container: container.current,
      style: STYLE_URL,
      center: [0, 20],
      zoom: 1.4,
      attributionControl: { compact: true },
      cooperativeGestures: false,
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    m.on("style.load", () => paintSunset(m));
    m.on("load", () => {
      // La atribución es obligatoria (licencia de OpenStreetMap), pero parte plegada como un botón ⓘ.
      container.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
      setReady(true);
    });
    m.on("error", () => {
      if (!m.loaded()) setFailed(true);
    });
    map.current = m;
    fittedCount.current = 0;
    return () => {
      m.remove();
      map.current = null;
    };
  }, [attempt]);

  // Pines y grupos.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;

    const index = new Supercluster<{ i: number }>({ radius: 64, maxZoom: 16 });
    index.load(located.map((p, i) => ({ type: "Feature", properties: { i }, geometry: { type: "Point", coordinates: [p.lng!, p.lat!] } })));

    const placeName = (p: Photo) => {
      if (!p.country) return t.map.sea;
      const country = new Intl.DisplayNames([lang], { type: "region" }).of(p.country) ?? p.country;
      return p.city ? `${p.city}, ${country}` : country;
    };

    const popupFor = (p: Photo) => {
      const date = p.takenAt ? new Date(p.takenAt).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" }) : "";
      const tags = [p.camera, p.iso && `ISO ${p.iso}`, p.fNumber && `f/${p.fNumber}`, p.exposure && formatShutter(p.exposure)].filter(Boolean) as string[];
      return `<div style="width:240px">
        ${p.thumb ? `<img src="${p.thumb}" alt="" style="display:block;width:100%;height:150px;object-fit:cover">` : ""}
        <div style="padding:10px 12px 12px">
          <div style="font-weight:700;font-size:13px;color:#3a2340">${esc(placeName(p))}</div>
          <div style="font-size:11px;color:#7a6380;margin-top:2px">${esc(date)}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">${tags
            .map((x) => `<span style="background:#fde6dc;color:#b8462a;border-radius:99px;padding:2px 8px;font-size:10px;font-weight:600">${esc(x)}</span>`)
            .join("")}</div>
        </div></div>`;
    };

    const render = () => {
      for (const mk of markers.current) mk.remove();
      markers.current = [];
      const b = m.getBounds();
      const clusters = index.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], Math.round(m.getZoom()));
      for (const c of clusters) {
        const [lng, lat] = c.geometry.coordinates as [number, number];
        const el = document.createElement("button");
        el.type = "button";
        if ("cluster" in c.properties && c.properties.cluster) {
          const { point_count: n, cluster_id: clusterId } = c.properties;
          const size = 34 + Math.min(n, 20);
          el.className = "pin-cluster";
          el.style.width = el.style.height = `${size}px`;
          el.textContent = String(n);
          el.setAttribute("aria-label", fill(t.map.photosHere, { n }));
          el.onclick = () => m.easeTo({ center: [lng, lat], zoom: index.getClusterExpansionZoom(clusterId) });
        } else {
          const p = located[(c.properties as { i: number }).i];
          el.className = "pin-photo";
          if (p.thumb) el.style.backgroundImage = `url(${p.thumb})`;
          el.setAttribute("aria-label", placeName(p));
          const popup = new maplibregl.Popup({ offset: 26, maxWidth: "260px" }).setHTML(popupFor(p));
          markers.current.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(m));
          continue;
        }
        markers.current.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(m));
      }
    };

    render();
    m.on("moveend", render);

    // Encuadrar todas las fotos cuando llegan nuevas.
    if (located.length && located.length !== fittedCount.current) {
      fittedCount.current = located.length;
      const bounds = new maplibregl.LngLatBounds();
      for (const p of located) bounds.extend([p.lng!, p.lat!]);
      m.fitBounds(bounds, { padding: Math.min(70, m.getContainer().clientWidth / 8), maxZoom: 11, duration: 900 });
    }

    return () => {
      m.off("moveend", render);
    };
  }, [located, ready, t, lang]);

  return (
    <div className="relative h-full min-h-[360px] overflow-hidden rounded-3xl glass">
      {/* Estilo en línea: la hoja de MapLibre fuerza position: relative en el contenedor. */}
      <div ref={container} style={{ position: "absolute", inset: 0 }} />
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-white/70 text-center">
          <div>
            <p className="font-semibold">{t.map.error}</p>
            <button onClick={() => setAttempt((a) => a + 1)} className="mt-3 rounded-full accent-gradient px-4 py-2 text-sm font-semibold text-white">
              {t.map.retry}
            </button>
          </div>
        </div>
      )}
      {!failed && photos.length > 0 && located.length === 0 && (
        <div className="absolute inset-x-6 top-6 mx-auto max-w-md rounded-2xl glass p-4 text-center">
          {/* Si traen datos de cámara pero ninguna ubicación en Android, lo más probable es que la galería borró el GPS. */}
          <p className="font-semibold">{android && photos.some((p) => p.camera) ? t.map.androidTitle : t.map.empty}</p>
          <p className="mt-1 text-sm text-muted">{android && photos.some((p) => p.camera) ? t.map.androidTip : t.map.emptyTip}</p>
        </div>
      )}
    </div>
  );
}
