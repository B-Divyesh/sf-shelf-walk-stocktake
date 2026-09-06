# Shelf Walk Stocktake — repair 4 handoff

- Work order: `shelf-walk-stocktake-repair-4`
- Implementation candidate: `564bc98faaf02d7c494531121748da51c31dc0d2`
- Previous verification/report commit: `c46bb263598492affd6eb9de969ca4b206db685d`
- Live URL: <https://shelf-walk-stocktake.sociobot.in>
- Deployed: 2026-09-06

## Status: PASS

The release-blocking unlisted quantitative claim is repaired. The public import
promise is now represented by `import-capacity` in `.factory/claims.json` and an
outcome-based browser test. It imports an actual 1,999,900-byte CSV containing
10,000 item rows through `/demo/`, then observes the real UI reject 10,001 rows
and 2,000,001 bytes.

The demo now has **Import a CSV in demo**. It exposes the normal import path
without leaving the `demo:shelf-walk-stocktake` IndexedDB namespace. The sample
is retained until a valid file replaces it, and **Return to sample** restores the
view without changing real work.

The small plain-language cleanup removes the remaining mood labels from the
landing, offline, and 404 pages. `.factory/copy-audit.md` now includes every
landing sentence. The catalog description is at `.factory/catalog-description.txt`
and copied to `/work/.evidence/catalog-description.txt`.

## Verification

From the documented clean setup (`npm ci`):

| Check | Result |
| --- | --- |
| `npm test` | PASS — 10/10 unit tests |
| `npm run typecheck` | PASS |
| `npm run build` | PASS — `dist/index.html` produced |
| Every exact declared claim command | PASS — 7 claims × desktop and phone Chromium |
| `npm run test:e2e -- --workers=1` | PASS — 32/32 local |
| `E2E_BASE_URL=https://shelf-walk-stocktake.sociobot.in npm run test:e2e -- --workers=1` | PASS — 32/32 live |
| `npm audit --omit=dev` and `git diff --check` | PASS |

The live suite covers the normal count/export flow, invalid/recovery paths,
manual barcode fallback, demo separation, privacy requests, keyboard/focus,
mobile, dark and reduced-motion rendering, Axe serious/critical violations,
service-worker offline reload, and update notification. Axe found zero
serious/critical issues in the tested landing, count, demo, and legal views.

`verify-url.sh` against the HTTPS origin found a 200 response in 618 ms, no
console or page errors, a title, `lang=en`, one `h1`, a main landmark, no missing
image alt text, and no unnamed buttons. Fresh desktop and 390 px phone contexts
both showed the job **“Count stock in one local stockroom.”**, the named audience,
and **“Try it with sample data”** linking to `/demo/` before scrolling. Neither
had horizontal overflow.

All 18 public build artifacts matched production SHA-256 values exactly. The
origin returns the self-only CSP, camera-only Permissions-Policy, HSTS,
`nosniff`, strict referrer policy, and immutable cache headers for hashed assets.
`/does-not-exist` returns HTTP 404 with the styled 404 title. `/`, `/demo/`,
`/privacy/`, `/terms/`, `robots.txt`, and `sitemap.xml` all return 200 with their
expected route titles.

Live Lighthouse 12.8.2: Performance **100**, Accessibility **100**, Best
Practices **100**, SEO **100**; LCP 1.3 s, CLS 0.019, TBT 10 ms, 88 KiB transfer.
The final main JavaScript is 24,666 B raw / 9,239 B gzip and CSS is 16,606 B raw /
4,392 B gzip.

## Earlier findings

| Report | Current disposition |
| --- | --- |
| Verification 1 | Numeric shortage variance export, response policy, responsive asset/cache work are covered by existing unit/browser/header checks. |
| Verification 2 | Manual scanner controls, focusable import/skip-link behavior, mobile target sizes, and immutable cache policy remain covered by the current browser and deployment tests. |
| Verification 3 | Demo isolation, plain first screen, claims inventory, crawl files, and a real 404 are present and exercised. |
| Verification 4 | Fixed here: the 2 MB / 10,000-row import promise is declared and quantitatively tested at both accept and reject boundaries. |

## Known dependency

The current shipped product does not advertise a paid offer or checkout. A
previously removed ₹799 one-time offer is not an actual live offer today, so no
`billing-offer.json` was written with a guessed price or registration state. If
the factory restores that paid deliverable, it needs a registered Sociobot billing
product and the normal checkout/entitlement verification before it is advertised.
