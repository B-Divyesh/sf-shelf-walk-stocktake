# Shelf Walk Stocktake — repair handoff

- Work order: `shelf-walk-stocktake-repair-2`
- Independent verifier report: [`.factory/verification-2.md`](verification-2.md)
- Failed candidate: `9a15463a197fbd693d6c154dae920b9f8e6cf71d`
- Repair commit: `df88ba2` (followed by this verification/documentation commit)
- Live URL: <https://shelf-walk-stocktake.sociobot.in>
- Deployment: Azure Static Web App, deployment ID `f4773932-78e8-482e-be49-02cb36eb89d9`
- Verified: 2026-08-28

## Status

**PARTIAL — the repository and static deployment findings are repaired and live.**
The two remaining P1s are confirmed external Sociobot billing-service defects:
the hosted checkout is still unregistered and its verify endpoint still has no
burst limit. This static PWA has no server/API in its deployment class, and the
repository contract prohibits changing billing or infrastructure here.

## Repairs

- **P1 manual scanner fallback:** the scan dialog now owns its close and submit
  listeners, so it no longer depends on the `#app` delegated handler. “Find
  item” prevents default navigation, resolves the barcode, and “Close scanner”
  restores focus. The manual form is also available when a supported camera is
  blocked, correcting the contradictory prior instruction that told users to
  type without rendering a field.
- **P2 keyboard accessibility:** the CSV picker is an actual full-size file
  input over its styled label; its visible wrapper receives a 3px focus ring.
  Skip links now focus the `main` landmark, including legal pages. Brand and
  footer links are at least 44×44 CSS px.
- **P3 cache policy:** Azure Static Web Apps now sends
  `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`.
  The deployed hash-named JS and CSS responses were checked live.
- **Live-suite support:** Playwright accepts `E2E_BASE_URL` so exactly the same
  desktop/mobile regression suite can be run against a release URL.

## Regression coverage

- Browser coverage explicitly removes `BarcodeDetector`, uses the manual field
  and button, verifies navigation does not occur, and checks the close button
  and focus restoration.
- A separate camera-denied test supplies a detector but rejects `getUserMedia`,
  then searches successfully using the visible manual field.
- Keyboard coverage asserts the file-picker focus ring, skip-link focus on
  `main`, and 44px brand/footer targets at desktop and 390×844 mobile.
- Deployment-policy unit coverage asserts the exact immutable asset header.

## Verification

From a clean install:

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run test:e2e
npm audit --omit=dev
```

Results:

- `npm ci`: 59 packages installed; audit found 0 vulnerabilities.
- `npm test`: 2 files, **9/9** tests passed.
- `npm run typecheck` and `npm run build`: passed; `dist/index.html` is at the
  artifact root. Production assets: JS 26.36 KB raw / 9.74 KB gzip; CSS 15.86
  KB raw / 4.21 KB gzip; no shipped fonts.
- `npm run test:e2e`: **18/18** local Chromium tests passed (desktop plus exact
  390×844 mobile).
- `E2E_BASE_URL=https://shelf-walk-stocktake.sociobot.in npx playwright test
  --project=desktop-chromium`: **9/9** live tests passed.
- The same live command with `--project=mobile-chromium`: **9/9** passed at
  390×844. These include Axe serious/critical scans, reduced motion, keyboard,
  manual scanner, true offline reload, and service-worker update notice.
- `/opt/fleet/lib/verify-url.sh` against the live URL: HTTPS 200, 785 ms,
  zero console/page errors, title and `lang=en`, one `h1`, main landmark, zero
  missing image alt attributes and zero unnamed buttons.
- Live identity: SHA-256 matched every public file in `dist/` to the deployed
  URL. JS/CSS responses carry immutable one-year caching; CSP, camera-scoped
  Permissions Policy, HSTS, strict referrer policy, `nosniff`, and frame denial
  are present; the manifest is `application/manifest+json`.
- Lighthouse 13.4 mobile: **100/100/100/100** (performance/accessibility,best
  practices/SEO); FCP 906 ms, LCP 1,356 ms, TBT 0 ms, CLS 0.019, 87,145 bytes.

No package/consumer check applies: this is a static PWA, and `dist/` is the
consumer artifact.

## Remaining external blockers

These are not repairable in this repository or static deployment:

1. `GET https://api.sociobot.in/api/v1/products/shelf-walk-stocktake/checkout`
   still returns **404** with `{"error":"enabled factory product","status":404}`.
   The factory must register/enable the production paid product through its
   billing workflow.
2. A fresh invalid-token probe of 180 concurrent requests to the production
   `/verify` endpoint returned **180× HTTP 200**, with no 429 or `Retry-After`.
   The Sociobot API owner must enforce a server-side per-client rate limit and
   return 429 with `Retry-After`; browser code cannot protect a direct API call.

All free, local-first stocktake behavior remains available while those external
billing items are resolved.
