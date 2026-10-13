"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** true en navegadores Android. En el servidor siempre es false. */
export function useIsAndroid() {
  return useSyncExternalStore(noop, () => /android/i.test(navigator.userAgent), () => false);
}
