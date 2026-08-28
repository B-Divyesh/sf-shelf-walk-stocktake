# Shelf Walk Stocktake — build handoff

Work order: `shelf-walk-stocktake-build-1`
Completed: 2026-08-28

## What was built

- A Vite + vanilla TypeScript offline PWA for the complete shelf-count workflow:
  safe CSV import, natural shelf-path order, full-path display, search, camera or
  manual barcode entry, duplicate-barcode location choice, count/variance
  reasons, notes, compressed local photo notes, review filters, variance-only CSV,
  audit CSV, and full JSON backup/restore.
- IndexedDB persistence for the current session and paid checkpoints. All count
  data stays on-device. The service worker precaches the generated Vite shell,
  provides cache-first assets and a navigation fallback, claims clients, and
  exposes the app's offline state.
- One-time Pro license flow through the Sociobot contract: hosted buy link,
  return-token capture, local token storage, no-more-than-daily verification,
  offline cached verdict, paste-to-restore, invalid/revoked handling, and a useful
  free tier. Pro adds counter attribution and up to five restorable checkpoints;
  core counting, photo notes, safety, backups and both exports remain free.
- Dedicated `/privacy/` and `/terms/` pages, app manifest, 192/512 maskable icons,
  empty/error/offline states, reduced motion, light/dark treatments, keyboard and
  390px mobile layouts.
- A product-specific “brutalist concrete and moss” system recorded in
  `.factory/design.md`. The original hero was generated with the factory Azure
  image command, visually reviewed, recorded with prompt/provenance, and shipped
  as a 70 KB WebP.

## Verification

Run from the repository root:

```sh
npm install
npm test
npm run build
npm run test:e2e
```

Results on 2026-08-28:

- `npm test`: 4/4 Vitest tests passed (quoted CSV, header aliases/natural sort,
  malformed/duplicate input rejection, variance selection, formula neutralising,
  audit output).
- `npm run build`: passed; `dist/index.html` produced. Initial app JavaScript is
  25.6 KB raw / 9.5 KB gzip; CSS is 15.4 KB raw / 4.1 KB gzip; hero is 70 KB.
- `npm run test:e2e`: 4/4 mobile Chromium tests passed. Covered import → count →
  variance → review → export readiness, light and dark/reduced-motion Axe checks,
  privacy page, and a real `context.setOffline(true)` reload.
- `/opt/fleet/lib/verify-url.sh`: passed with title, `lang=en`, exactly one `h1`,
  a main landmark, no missing image alt, no unnamed button and no console errors.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 92. LCP 1.8 s, FCP 1.0 s, TBT 0 ms, CLS 0.019, transfer 88 KiB.
  Lighthouse lab mode did not emit INP; TBT was used as the interaction proxy.
- Generated hero 70 KB, below the 300 KB budget. No fonts are shipped. JS and
  CSS are far below the 200 KB / 50 KB limits.

## Known gaps and next steps

- Automatic camera decoding depends on the browser's `BarcodeDetector` support
  and HTTPS camera permission. Unsupported browsers receive an in-context manual
  barcode field; this is intentional rather than a bundled decoder dependency.
- The checkout/verify routes are implemented for the product slug, but the
  factory must register and price the production product before paid checkout can
  succeed. No product ID or payment-provider secret is hardcoded.
- The 300-SKU / 95% intended-location success measure needs a real operator pilot;
  automated tests cover duplicate barcode disambiguation logic and full paths,
  not warehouse scan conditions.
- Browser storage is finite and optional photos can consume it. Images are capped,
  resized to 960 px and compressed, but operators should export a JSON backup for
  long-term retention.

No infrastructure, DNS, billing registration, analytics or external runtime
assets were added.
