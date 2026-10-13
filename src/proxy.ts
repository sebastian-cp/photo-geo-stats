import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, locales } from "@/i18n/dict";

/** Elige el idioma según Accept-Language: el primero que coincida con es/en. */
function pickLocale(header: string | null) {
  const prefs = (header ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return prefs.find((p) => hasLocale(p.lang))?.lang ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;
  request.nextUrl.pathname = `/${pickLocale(request.headers.get("accept-language"))}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Solo páginas: se excluyen _next, archivos con extensión (fotos de ejemplo, favicon) y la API.
  matcher: ["/((?!_next|.*\\..*).*)"],
};
