# Shelf Walk Stocktake — repair handoff

- Work order: `shelf-walk-stocktake-repair-1`
- Verifier report: `71af260260057af6cb4a9401e35dc74ab85d226c`
- Failed candidate: `caf79e653a46e72b32b7a4f3d9d2f6c3c44725c6`
- Repair commits: `6f88f5c`, `63022c0`
- Live URL: <https://shelf-walk-stocktake.sociobot.in>
Completed: 2026-08-28

## Status

**PASS — both verifier findings are repaired and deployed.** The live product now
exports shortages as numeric CSV values and returns the required restrictive CSP
and Permissions Policy. The researched brief, static PWA artifact class, visual
system and already-passing workflows were preserved.

## Repairs

- **P1 numeric shortage export:** reproduced the candidate output `"'-2"`. The
  serializer now distinguishes trusted finite numbers from untrusted strings.
  Expected, counted and variance fields are emitted as unquoted numeric values;
  imported text still receives spreadsheet-formula neutralisation. Non-finite
  numeric values fail closed.
- **P2 response policy:** added the Azure Static Web Apps configuration shipped
  in `dist/`. It sets a self-only default CSP, denies objects and framing, limits
  connections to the app and Sociobot license APIs, permits camera use only for
  this origin, disables unrelated sensitive capabilities, preserves strict
  referrer/nosniff headers, and serves `.webmanifest` as
  `application/manifest+json`.
- **PWA update/offline hardening:** advanced the shell to `shelf-walk-v2` and
  manifest start URL to `?v=2`. Precache requests use reload semantics, and
  cache lookup ignores response `Vary` differences. This prevents a conditional
  revalidation race from leaving an installed app with an empty cached JS body.

## Regression coverage

- Unit coverage parses real negative and positive variance rows back through the
  consumer path, asserts `-2` and `2`, checks raw numeric columns, retains formula
  protection for `=BAD` and `-UNTRUSTED`, and rejects non-finite numbers.
- Deployment-policy tests assert the exact CSP, camera Permissions Policy,
  disabled geolocation/microphone/payment/USB, and manifest MIME mapping.
- Playwright downloads the real variance CSV after a shortage and verifies the
  downstream parsed value and raw numeric serialization on both desktop and
  390×844 mobile Chromium.
- Browser coverage also asserts full cached JS bytes before a true offline reload,
  keyboard-contained scanner fallback and focus restoration, reduced motion,
  light/dark accessibility, legal pages, and the installed-worker update notice.

## Clean local verification

Run in repository root:

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run test:e2e
npm audit --omit=dev
```

Results from the final clean run:

- `npm ci`: 59 packages installed from lockfile; 0 vulnerabilities.
- `npm test`: 2 files, 8/8 tests passed.
- `npm run typecheck`: passed with strict TypeScript settings.
- `npm run build`: passed; `dist/index.html` is at the required root.
- `npm run test:e2e`: 12/12 passed across desktop Chromium and an exact
  390×844 mobile viewport.
- `npm audit --omit=dev`: 0 vulnerabilities.
- No separate package/consumer publish step applies to this static PWA; the
  production `dist/` build is the consumable artifact. No separate linter is
  configured; strict `tsc --noEmit` is the repository's static-analysis gate.
- Production sizes: app JS 25.94 KB raw / 9.62 KB gzip; CSS 15.44 KB raw /
  4.14 KB gzip; hero WebP 70,794 bytes. There are no shipped fonts.

## Deployed verification

- Deployment completed through `/opt/fleet/lib/deploy-static.sh` to the existing
  Azure Static Web App in `centralus`; deployment ID
  `9f0e274a-3221-406d-81b5-e7484e60f460` succeeded. The custom domain returned
  HTTPS 200.
- Live desktop and 390×844 mobile stock-count runs imported expected `12`, saved
  counted `10` / reason `Damaged`, downloaded the CSV, and confirmed raw
  `,12,10,-2,` with no apostrophe. Both runs had zero console/page errors and no
  requests outside the product origin.
- SHA-256 checks matched all 14 public files in local `dist/` to their live URLs.
  `staticwebapp.config.json` is deployment metadata consumed by Azure and is not
  a public asset. App bundle SHA-256:
  `7ce52c16b5ad89322c4b1d4fda58e208a75a25f6cb6f528696d57efbc68c5401`;
  worker SHA-256:
  `f8665eb616b8485e873feba7040ad0ab74b4bacec253099992dbd1ddf7f696ed`.
- Live headers on `/`, `/privacy/`, `/terms/`, `/manifest.webmanifest` and
  `/sw.js` include CSP, Permissions Policy, HSTS, strict referrer policy,
  `nosniff`, and frame denial. The manifest MIME is
  `application/manifest+json`.
- `/opt/fleet/lib/verify-url.sh`: HTTPS 200, 733 ms load, zero console errors,
  title and `lang=en` present, exactly one `h1`, main landmark present, zero
  missing image alt attributes and zero unnamed buttons. Desktop and mobile
  screenshots were captured during the probe.
- Live Axe WCAG 2 A/AA scans: zero serious/critical findings on landing, active
  count, dark/reduced-motion count, and privacy.
- Lighthouse 12.8.2 mobile: Performance **99**, Accessibility **100**, Best
  Practices **100**, SEO **100**; FCP 1.0 s, LCP 1.4 s, TBT 90 ms, CLS 0.019,
  total transfer 88 KiB.

## Remaining external item

The production verify endpoint correctly returns `{ valid: false, reason:
"invalid" }` for an invalid token, but the hosted production checkout route
currently returns HTTP 404 because the factory has not registered the live paid
product. Registration is outside this repository and must be completed through
the factory billing workflow; no payment-provider integration or secret belongs
in this codebase. The free stocktake, photo notes, backup, variance export and
audit export remain fully usable.
