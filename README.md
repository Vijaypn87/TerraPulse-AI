# TerraPulse AI — Intelligence for a Living Planet

An environmental intelligence interface: an immersive, scroll-driven 3D Earth, air-quality views, forecasting interfaces and community reporting.

> **Data status:** this build runs on bundled sample data. Environmental measurements and predictions shown in the app are illustrative until live data integration is implemented. No machine-learning model ships with this repository.

## Features

- **Environmental overview** — AQI, PM2.5 (converted from AQI using EPA breakpoints), cleanliness, noise and trend charts.
- **Forecast interface** — 24h / 72h horizons with historical-vs-projected curves. Without a connected model the curve is an illustrative projection, not an ML prediction.
- **Live map** — MapLibre GL map with hotspot layers and place search (OpenStreetMap Nominatim). Searching a place shows its location only; no readings are generated.
- **Cinematic 3D Earth** — one persistent React Three Fiber scene driven by scroll (Lenis + framer-motion), with drag-to-rotate on the Live Earth section. It falls back to a static image without WebGL and respects `prefers-reduced-motion`.
- **Community** — report feed, cleanup events, alerts and profile pages.
- Light and dark themes.

## Tech stack

TanStack Start (React 19, SSR) · TanStack Query · TypeScript · Vite 8 · Tailwind CSS v4 · React Three Fiber / Three.js · MapLibre GL · Recharts · Framer Motion · Nitro (Cloudflare target).

The Vite configuration uses the `@lovable.dev/vite-tanstack-config` preset, which bundles the TanStack Start, React, Tailwind, path-alias and Nitro plugins. It is a build dependency only; the project has no runtime dependency on any hosted service.

## Getting started

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```bash
git clone <your-repository-url>
cd <repository-folder>
npm install
npm run dev
```

Vite prints the local URL.

### Scripts

| Command           | Purpose                                                     |
| ----------------- | ----------------------------------------------------------- |
| `npm run dev`     | Start the development server                                |
| `npm run build`   | Production build into `.output/` (Nitro, Cloudflare target) |
| `npm run preview` | Preview the production build                                |
| `npm run lint`    | ESLint                                                      |
| `npm run format`  | Prettier                                                    |

## Data sources and configuration

By default no backend is configured and the app uses the sample data in `src/lib/mock-data.ts`.

To point the app at a backend, set `VITE_API_BASE_URL` (for example in a local `.env` file, which is git-ignored). Endpoints are listed in `src/lib/api.ts`; the forecast contract is in `src/lib/forecast.ts`. When a configured backend cannot be reached, the app shows an "unavailable" state instead of substituting sample data. A forecast is labelled "ML prediction" only when the backend returns `source: "model"`.

## Deployment (Cloudflare)

```bash
npm run build
npx nitro deploy --prebuilt
```

The build writes a Cloudflare Worker with static assets to `.output/`. Authenticate with Wrangler (`npx wrangler login`) first. Set `VITE_API_BASE_URL` at build time if you use a backend.

## License

MIT. Add a `LICENSE` file with your copyright notice before publishing.
