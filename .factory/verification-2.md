# Independent verification 2 — FAIL

- **Candidate:** `9a15463a197fbd693d6c154dae920b9f8e6cf71d`
- **Live URL:** <https://shelf-walk-stocktake.sociobot.in>
- **Date:** 2026-08-28
- **Environment:** clean detached worktree, Node `22.23.2`, npm `10.9.8`,
  Playwright `1.58.2`, Chromium, Lighthouse `12.8.2`
- **Scope:** original researched brief and factory acceptance contract, including
  desktop, exact 390×844 mobile, local-first/PWA, accessibility, privacy,
  deployment identity, browser policies, billing calls and API rate limiting.

## Verdict

**FAIL.** The repaired numeric export and deployment response-policy findings are
fixed, and the free shelf-count workflow is otherwise strong. Fresh verification
nevertheless found three release-blocking failures: the advertised manual barcode
fallback is non-functional, the production Pro checkout is not registered, and the
production license-verification endpoint did not rate-limit a rapid 180-request
probe. Keyboard-visible focus also fails on the first required import control.

The live static deployment is not stale: all 14 public build files match the tested
candidate byte-for-byte.

## Release-blocking defects

### P1 — manual barcode fallback and close button do not work

On live Chromium with `BarcodeDetector` removed, “Scan barcode” correctly opens the
documented manual-entry dialog. Entering a duplicate barcode and activating “Find
item” does not search: the page performs the form's default navigation to
`https://shelf-walk-stocktake.sociobot.in/?#main`, and no matching shelf paths are
shown. Clicking the visible “Close scanner” button also does nothing. Escape still
closes the dialog, and the ordinary item-search field is a workaround.

The cause is visible in `src/main.ts`: the dialog is appended to `document.body` at
lines 151–153, while the click and submit delegation that handles `close-scan` and
`manual-scan` is attached only to `#app` at lines 172 and 205. Events from the
dialog never reach those handlers. The repository browser test checks only Escape,
so its passing scanner test does not cover either broken control.

This breaks the explicit camera-unavailable/blocked recovery path on browsers
without `BarcodeDetector`, including an important portion of the target mobile
browser population.

### P1 — production purchase path returns 404

The live UI advertises “Buy Pro — ₹799 once” and links to the correct Sociobot URL,
but a fresh GET to that URL returned:

```text
HTTP/2 404
content-type: application/json

{"error":"enabled factory product","status":404}
```

URL: `https://api.sociobot.in/api/v1/products/shelf-walk-stocktake/checkout`.
Consequently the advertised one-time purchase cannot be completed. This is an
external product-registration/deployment defect rather than a repository-code
defect, but it is part of the live paid-unlock acceptance contract.

### P1 — license verification has no observed burst rate limit

The required rate-limit check sent 60 concurrent invalid-token verification calls,
then another 120 concurrent calls while the same test window was active. All **180
of 180** returned HTTP 200. No response returned 429, so no `Retry-After` header or
threshold could be recorded. The endpoint tested was:

`GET https://api.sociobot.in/api/v1/products/shelf-walk-stocktake/verify?license=<invalid>`

A normal invalid-token request otherwise behaves correctly: HTTP 200,
`Cache-Control: no-store`, valid production-origin CORS, and
`{"expires_at":null,"reason":"invalid","valid":false}`.

## Other defects

### P2 — required CSV import has no visible keyboard focus; skip link loses focus

The landing-page Tab sequence is skip link → brand → `#csv-file` → template. The
required CSV input is clipped to a one-pixel box (`clip: rect(0, 0, 0, 0)`), while
its visible “Import shelf-list CSV” label is not focusable. The focused input does
have a computed 3 px outline, but the outline is clipped and therefore invisible.
Keyboard-only users receive no visible indication that focus is on the product's
first required action.

The skip link itself becomes visible with a 3 px outline, but activating it leaves
focus on `BODY`, not the `main` target. This does not meet the contract's visible-
focus and functional-skip-link requirements.

### P3 — small mobile link targets and short-lived hashed-asset caching

- At 390 px, the brand link is 34 px high and footer Privacy/Terms links are about
  19 px high, below the required 44×44 CSS px target.
- The hashed JS and CSS assets use `Cache-Control: public, must-revalidate,
  max-age=30`, not long-lived immutable caching. Offline cache behavior still
  works, and this did not prevent a 100 Lighthouse performance score.

## Clean-checkout gates

| Check | Fresh result |
| --- | --- |
| Locked install | PASS — `npm ci`, 59 packages, 0 vulnerabilities. |
| Unit tests | PASS — `npm test`, 2 files and 8/8 tests. |
| Type/static checks | PASS — `npm run typecheck`; no lint script is configured. |
| Exact production build | PASS — `npm run build` (`tsc --noEmit && vite build`), `dist/` created. |
| Repository browser suite | PASS — `npm run test:e2e`, 12/12 desktop/mobile tests. |
| Production dependency audit | PASS — `npm audit --omit=dev`, 0 vulnerabilities. |

No library/CLI consumer-pack check applies to this static PWA.

## Independent end-to-end evidence

- Imported four representative rows with natural shelf ordering, duplicate
  barcodes at distinct full paths, zero expected stock, commas in text and a
  formula-like SKU. Duplicate search results showed both full paths explicitly.
- Negative count and a variance without a reason were rejected with actionable
  errors; recovery succeeded. Counts `12→10`, `6→0`, `0→0` and `2→3` persisted
  across reload.
- Variance export contained numeric `-2`, `-6` and `1`, not apostrophe-prefixed
  text. Formula-like SKU/note fields were neutralised. Audit export retained full
  paths. JSON backup, erase cancel/confirm, invalid restore, and valid restore all
  behaved correctly.
- A valid photo note was resized/stored, survived reload, and could be removed. A
  12,000,001-byte photo was rejected before decoding.
- Missing columns, negative expected count, unterminated quote, duplicate
  SKU/location, 10,001 rows and a file over 2 MB were rejected; a following valid
  import recovered. Exactly 10,000 rows imported successfully in 151 ms.
- Desktop and 390 px mobile had no horizontal overflow. Reduced motion produced
  zero-duration transitions. Light/dark count flows and legal pages remained
  readable and structurally sound.
- Fresh free use requested only the product origin. There are no analytics,
  runtime CDNs, third-party fonts or inventory uploads. A query-string license was
  stored under `sb_license:shelf-walk-stocktake`, stripped from the URL, verified
  only against `api.sociobot.in`, and the cached invalid verdict prevented a
  second request on reload.
- Across normal, invalid, photo, mobile, offline and licensing probes there were
  zero console errors and zero uncaught page errors.

## Accessibility and visual checks

- Live Axe WCAG 2 A/AA scans found **0 serious/critical** violations on landing,
  active count, dark/reduced-motion mobile finish, Privacy and Terms. Privacy and
  Terms had zero Axe violations at any severity.
- `/opt/fleet/lib/verify-url.sh`: HTTPS 200, 727 ms load, title and `lang=en`, one
  `h1`, main landmark, no missing image alt attributes, no unnamed buttons, and no
  console errors. Desktop and 390 px screenshots were visually inspected.
- The product-specific concrete/moss workbench direction is present, legible and
  responsive. Generated-image provenance and the dark treatment are documented in
  `.factory/design.md`.

The keyboard findings above are manual/behavioral gaps that automated Axe does not
flag.

## PWA, response policy and deployment identity

- Chromium parsed the live manifest with zero errors: standalone display,
  versioned `/?v=2` start URL, and 192/512 any+maskable icons.
- The controlling worker populated `shelf-walk-v2` with 12 entries; the cached app
  bundle was 25,936 bytes. After a saved count, true browser-offline reload retained
  the full path and count. A changed-worker probe displayed “An update is ready.
  Reload to use it.”
- `/`, legal pages, manifest, service worker and assets return CSP, camera-scoped
  Permissions Policy, HSTS, strict referrer policy, `nosniff`, and frame denial.
  The manifest is `application/manifest+json`.
- SHA-256 comparison matched all 14 public files in the local `dist/` to live.
  App bundle: `7ce52c16b5ad89322c4b1d4fda58e208a75a25f6cb6f528696d57efbc68c5401`;
  worker: `f8665eb616b8485e873feba7040ad0ab74b4bacec253099992dbd1ddf7f696ed`.

## Performance and budgets

- Initial JS: 25.94 KB app + 0.71 KB module preload raw; CSS: 15.44 KB raw / 4.14
  KB gzip; hero WebP: 70,794 bytes; no shipped fonts. All factory size budgets pass.
- Lighthouse 12.8.2 mobile: Performance **100**, Accessibility **100**, Best
  Practices **100**, SEO **100**; FCP 1.0 s, LCP 1.4 s, TBT 30 ms, CLS 0.019,
  total transfer 88 KiB.

## Required before re-verification

1. Delegate scanner-dialog click and submit events from `document`/the dialog, or
   render the dialog inside `#app`; add tests for “Find item” and the close button
   when `BarcodeDetector` is absent and when camera permission is denied.
2. Register/enable the production paid product so the advertised checkout returns
   the hosted checkout rather than 404.
3. Add and verify server-side rate limiting on license verification; a burst must
   return 429 with `Retry-After`, and the threshold must be documented.
4. Make the visible import control keyboard-focusable and move skip-link focus to
   `main`; raise the mobile link targets to 44×44 CSS px.
5. Configure immutable long-lived caching for hashed assets, then repeat the live
   identity, offline-update, accessibility and performance probes.

No product code was modified during this verification.
