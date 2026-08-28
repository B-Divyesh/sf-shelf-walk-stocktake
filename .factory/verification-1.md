# Independent verification 1 — FAIL

- **Candidate:** `caf79e653a46e72b32b7a4f3d9d2f6c3c44725c6`
- **Live URL:** <https://shelf-walk-stocktake.sociobot.in>
- **Date:** 2026-08-28
- **Verifier scope:** clean checkout, production build, live deployment, PWA/offline,
  accessibility, privacy/network policy, and representative stock-count workflow.

## Verdict

**FAIL.** The primary variance export contains a P1 data-contract defect: negative
variances are emitted as spreadsheet text rather than numeric CSV values. This means
the normal shortage case is not a defensible/import-ready variance file without
downstream cleanup, contrary to the researched brief.

The live deployment otherwise matches the tested candidate byte-for-byte for every
file in `dist/`.

## P1 — numeric shortage exported as text

`src/csv.ts` sends every value through a formula-injection guard. After conversion to
a string it prefixes values beginning with `-`, including the calculated numeric
`variance` field. A real browser export after expected `12`, counted `10`, reason
`Damaged` produced:

```csv
"SAFE-1","Hex nuts","111","Aisle 2 / Bay 1 / Shelf A","12","10","'-2","Damaged","","2026-08-28T06:36:22.792Z"
```

The apostrophe is literal CSV data, not CSV quoting. `variance` is consequently the
text `'-2`, not numeric `-2`; a stock-system importer or spreadsheet will treat it as
text. Formula neutralisation must remain for untrusted text fields, but known numeric
fields must be serialised as numbers (or be otherwise preserved as numeric values).

## P2 — deployment response policy is incomplete

Live responses have HSTS, `nosniff`, and a strict referrer policy, but no
`Content-Security-Policy` or `Permissions-Policy`. This local-first app handles
sensitive shelf paths and photo notes, so a restrictive CSP and explicit camera
policy are warranted as defence in depth. This is a deployment/configuration issue;
it is not represented by an application-code diff.

## Checks run from a clean checkout

Clean clone: `/tmp/shelf-walk-qa.GkRvTq` at the candidate SHA; locked install used
`npm ci`.

| Check | Result | Evidence |
| --- | --- | --- |
| Unit tests | PASS | `npm test`: 1 file, 4 tests passed. |
| Typecheck + exact production build | PASS | `npm run build` (`tsc --noEmit && vite build`) passed; `dist/` produced. |
| Repository browser suite | PASS | `npm run test:e2e`: 4/4 Playwright mobile Chromium tests passed. |
| Deploy identity | PASS | SHA-256 comparison of every local `dist/` file against its live URL: all matched. |
| Normal count path | PASS except P1 export | Imported 3 shelf paths in natural order; saved a damaged shortage; searched barcode `333`; reviewed incomplete count; variance-only export contained only the shortage. |
| Invalid/recovery paths | PASS | Missing required headers, negative expected, unterminated quote, duplicate SKU/location, 10,001 rows and >2 MB file all show errors; a subsequent valid import recovers. 10,000 rows imported in 431 ms. |
| Barcode/camera fallback | PASS | At 390 px Chromium without `BarcodeDetector`, Scan opens the labelled manual-barcode dialog; Escape closes it and restores focus. |
| Keyboard/focus/reduced motion | PASS | Keyboard-only dialog focus cycles correctly; focused count field has a visible 3 px outline; reduced-motion transition is `none`. |
| Accessibility | PASS | Live axe WCAG 2 A/AA serious/critical: 0 on landing, active count, dark/reduced-motion count, and privacy page. Exactly one `h1`, `lang=en`, main landmark, labels, and skip link were present. |
| Console/page errors | PASS | None during the normal, invalid, mobile, offline, or accessibility probes. |
| Privacy/network | PASS | Fresh normal use made requests only to the product origin; no analytics/CDNs/fonts. Data persistence is IndexedDB. Code calls Sociobot verification only if a stored Pro token exists, as documented. |
| PWA manifest + offline | PASS | Chrome DevTools parsed the live manifest with no errors. Service worker controlled the page; after `context.setOffline(true)`, reload rendered the app shell with no errors. A controlled changed-worker probe displayed “An update is ready. Reload to use it.” |
| Caching | PASS with policy note | App shell/offline cache worked. Static live responses use `Cache-Control: public, must-revalidate, max-age=30`, not long-lived immutable cache headers. |
| Bundle budgets | PASS for JS/CSS and wire transfer | Initial JS: 25.8 KB raw / 9.6 KB gzip; CSS: 15.4 KB raw / 4.1 KB gzip; no fonts. Lighthouse observed 87 KiB total transfer and 71 KB hero transfer on the live mobile run. The on-disk hero WebP is 708 KB, so it relies on server compression; responsive image variants are still advisable. |
| Lighthouse mobile | ADVISORY BELOW TARGET | Lighthouse 12.8.2: Performance **87**, Accessibility **100**, LCP 1.3 s, CLS 0.019, TBT 500 ms, 87 KiB transfer. This is below the attached 90 performance target. A second attempt aborted with a local Chrome `Connection closed` harness error, not a page error. |

## Live headers observed

`/`, JS, CSS, service worker, manifest, legal pages and offline page return HTTPS,
HSTS (`max-age=10886400; includeSubDomains; preload`),
`Referrer-Policy: strict-origin-when-cross-origin`, and
`X-Content-Type-Options: nosniff`. The manifest is served as
`application/octet-stream`, though Chrome parsed it without errors. No CSP or
Permissions-Policy header was returned. Hashed asset URLs are only cached for 30
seconds at the CDN.

## Required next steps

1. Fix the CSV serializer so finite numeric fields, especially negative
   `variance`, remain numeric while untrusted text continues to be formula-safe;
   add a regression test for a shortage export.
2. Re-run the clean-checkout suite and a real downstream-import test with both a
   negative and positive variance.
3. Add deployment CSP/Permissions-Policy and remeasure Lighthouse mobile; consider
   responsive hero derivatives and immutable caching for hashed assets.

No product code was modified during verification.
