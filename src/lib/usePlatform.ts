"use client";

import { useSyncExternalStore } from "react";

export type Platform = "android" | "ios" | "desktop";

const noop = () => () => {};

function detect(): Platform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  // Los iPad recientes se presentan como Mac: se distinguen por la pantalla táctil.
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return "desktop";
}

/** Sistema del visitante; en el servidor siempre es "desktop" para no mostrar avisos de celular antes de tiempo. */
export function usePlatform(): Platform {
  return useSyncExternalStore(noop, detect, () => "desktop");
}
