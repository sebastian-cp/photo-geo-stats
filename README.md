# photo-geo-stats

**Suelta tus fotos y descubre dónde las tomaste y con qué cámara.**
Todo ocurre en tu navegador: tus fotos no se suben a ningún servidor.

## Qué hace

- 🗺️ **Mapa de tus fotos** a partir del GPS de su EXIF, con miniaturas como pines y grupos para las fotos cercanas.
- 📷 **Estadísticas de equipo y técnica:** cámaras más usadas, ISO, apertura y velocidad con mini histogramas.
- 🌅 **Hora del día** en que más fotografías: mañana, tarde, hora dorada o noche.
- 📍 **País y ciudad** de cada foto, calculados **sin conexión**.
- 🧭 **Perfil de fotógrafo:** trotamundos, cazador de la hora dorada, ave nocturna, fotógrafo de bolsillo y más.
- 📤 **Comparte tus viajes:** genera una imagen para historias (1080×1920) o posts (1080×1350) con tu mapa, un collage y tus cifras.
- 🧳 **Probar con ejemplos:** 20 fotos de viaje con licencia Creative Commons para verla funcionar sin tener fotos a mano.
- 🌐 **Español e inglés,** según el idioma de tu navegador.

## Privacidad

Las fotos se leen con [exifr](https://github.com/MikeKovarik/exifr) dentro de un Web Worker. En memoria solo quedan los metadatos y una miniatura, y nada se guarda al recargar. El país sale de fronteras reales ([country-coder](https://github.com/rapideditor/country-coder)) y la ciudad de un índice de [GeoNames](https://www.geonames.org/) incluido en la app, así que **las coordenadas nunca salen del navegador**. La imagen para compartir también se genera localmente.

Lo único que se pide a internet son las teselas del mapa ([OpenFreeMap](https://openfreemap.org/)), que solo revelan la zona que estás mirando, no tus fotos.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · MapLibre GL · Supercluster · modern-screenshot · Vitest · Playwright

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:3001
npm test             # pruebas unitarias (estadísticas, geocodificación, reglas de carga, perfil)
npm run test:e2e     # Playwright (en local usa el servidor de desarrollo)
npm run lint
npm run typecheck
```

Scripts de datos (ya ejecutados; sus resultados están en el repo):

```bash
npm run data:samples   # descarga las fotos de ejemplo de Wikimedia Commons conservando el EXIF
npm run data:cities    # genera src/data/cities.json desde GeoNames
node scripts/build-land-dots.mjs   # genera el mapa mundi punteado de la tarjeta para compartir
```

## Límites

Hasta 50 fotos por sesión · JPG, HEIC, PNG y WebP. La vista previa de las HEIC depende del navegador; sus metadatos se leen siempre.

## Créditos

- Fotos de ejemplo: colaboradores de Wikimedia Commons. El autor y la licencia de cada una están en [`public/samples/credits.json`](public/samples/credits.json).
- Ciudades: GeoNames (CC BY 4.0).
- Datos del mapa: © colaboradores de OpenStreetMap.

## Licencia

[MIT](LICENSE) · Hecho por [Sebastián Cofré](https://github.com/sebastian-cp)
