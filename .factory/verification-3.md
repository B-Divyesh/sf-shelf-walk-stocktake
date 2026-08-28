# Independent verification 3 — Shelf Walk Stocktake

- **Candidate commit:** `488ee8991a312b600679306250529b40767a86e2`
- **Live URL:** <https://shelf-walk-stocktake.sociobot.in>
- **Verified:** 2026-08-28
- **Scope:** clean-install repository checks; production build; live desktop and
  390×844 mobile PWA; demo/claims acceptance contract; stock-count workflow;
  invalid-input recovery; privacy/network policy; headers/caching; accessibility;
  rate limiting; and deployment identity.

## Verdict: FAIL

The free stock-count workflow is functional, but this candidate fails the
mandatory release contract.  There is no claims inventory, and no isolated,
one-click sample-data demo.  The first cold screen also does not say in plain
words who the product is for and has no **Try it with sample data** action.
Separately, the paid purchase link exposed by the product is a production 404.

## Release-blocking defects

### P0 — required claims inventory is absent

`.factory/claims.json` does not exist in the clean candidate.  Therefore there
were no claim commands to execute through a demo entry point, which itself is a
release-blocking outcome under the supplied claims contract.  The landing page,
README, and legal copy make relied-on claims (offline operation, local storage,
exports, no analytics, camera behavior, and daily licensing) without the
required one-test-per-claim inventory and sandbox evidence.

### P0 — no demo sandbox; `?demo=1` writes to the real storage namespace

Fresh Chromium evidence at
`https://shelf-walk-stocktake.sociobot.in/?demo=1`:

- no visible **Try it with sample data** action;
- no `Demo — sample data, nothing is saved` banner;
- no **Reset demo** or **Start for real** control;
- importing a sample row creates the IndexedDB database
  `shelf-walk-stocktake`, the ordinary production database, rather than a
  `demo:` namespace; and
- there is no `.factory/demo.md`.

This violates the required one-click, realistic, isolated demo and permits a
visitor who follows the documented demo URL to write into normal local data.

### P0 — first-read acceptance test fails

Cold live landing evidence (desktop, no prior storage) has heading **“Walk the
shelf. Trust the variance.”**, an import-file picker, and a template download.
It does communicate a stock-count task, but it does not plainly name the
intended single-location wholesaler/workshop/retailer on the first screen, and
does not say what to click first without already having a CSV.  It has no
one-click sample-data action.  The mandatory plain-words/demo rule explicitly
marks either condition as a candidate failure.

### P1 — advertised production Pro checkout is broken

The live **Buy Pro — ₹799 once** link targets:

`https://api.sociobot.in/api/v1/products/shelf-walk-stocktake/checkout`

Fresh `GET` on 2026-08-28 returned HTTP **404** with:

```json
{"error":"enabled factory product","status":404}
```

The paid feature is visible, priced, and relied on in the product, so the
purchase path is not end to end.  Registration/enablement belongs to the
Sociobot billing/factory owner; it cannot be repaired in this static PWA repo.

## Other defects

### P2 — required crawl artifacts / real 404 are absent

Live `GET /robots.txt` and `GET /sitemap.xml` both returned 404.  A nonexistent
route (`/missing-route`) returned the normal application shell with HTTP 200,
not a styled, real 404 page.  This does not block the count operation, but it
does not meet the site-structure contract.

## What passed

| Check | Result and fresh evidence |
| --- | --- |
| Clean install | `npm ci` installed 59 packages; npm reported 0 vulnerabilities. |
| Required repository tests | `npm test`: 9/9 Vitest tests passed. |
| Type/build | `npm run typecheck` passed. `npm run build` passed and produced `dist/` at its root. |
| Browser suite, built local app | `E2E_BASE_URL=http://127.0.0.1:4173 npx playwright test --workers=1`: **18/18 passed**. The preview was the freshly built `dist/` output. |
| Browser suite, production | `E2E_BASE_URL=https://shelf-walk-stocktake.sociobot.in npx playwright test --workers=1`: **18/18 passed** across desktop and exact 390×844 mobile. |
| Core user journey | Imported a representative shelf CSV, retained natural shelf ordering/full paths, recorded a damaged shortage, barcode-searched another item, reviewed incompleteness, and downloaded the variance CSV. The automated suite asserts the export has one data row and numeric `-2`. |
| Invalid/recovery paths | Negative expected import gave `Row 2: sku, location and a non-negative expected count are required.`; negative count gave `Enter a count of zero or more.`; a variance without a reason gave `Choose a reason for this variance.` and focused the reason control. Selecting Damaged then saved and showed 1 counted / 1 variance. |
| Scanner/camera recovery | Local and production tests passed manual barcode entry with no `BarcodeDetector`, denied-camera recovery, Escape close, and focus restoration. |
| PWA | Production service-worker-controlled offline reload passed after first visit. A changed-worker registration displayed `An update is ready. Reload to use it.` in both viewports. Manifest is valid (`display: standalone`, maskable 192/512 icons, `start_url=/?v=2`). |
| Accessibility | Production Playwright Axe WCAG 2 A/AA scans found **0 serious/critical** violations on landing, active count (including dark/reduced motion), Privacy, and Terms. `verify-url.sh` passed: title present, `lang=en`, exactly one h1, main landmark, zero missing alt attributes/unnamed buttons, and zero console/page errors. Keyboard tests cover the skip link, focus ring, dialog focus trap/restoration, and ≥44px header/footer targets. |
| Mobile/visual | Fresh 390×844 interaction completed without horizontal overflow or console/page errors; touch targets and stacked controls were usable. |
| Privacy/network | In a fresh normal import/count flow all captured browser requests were same-origin `https://shelf-walk-stocktake.sociobot.in`; no analytics, fonts, or CDN requests occurred. IndexedDB holds normal data. The missing demo isolation is the exception described above. |
| Security response policy | Live root/asset responses have HSTS, CSP limiting script/source to self (and explicit Sociobot API connect origins), camera-scoped Permissions-Policy, `nosniff`, strict referrer policy, and frame denial. |
| Cache/budget | Hash-named JS/CSS return `Cache-Control: public, max-age=31536000, immutable`; HTML is 30 s revalidated. Built app JS is 26,356 B raw / 9,740 B gzip; CSS 15,856 B raw / 4,210 B gzip; hero WebP 70,794 B; no shipped fonts. These are within the supplied static/PWA budgets. |
| Deployment identity | SHA-256 comparison of all 14 deployed public artifacts (HTML, assets, icons, manifest, service worker, offline page and legal pages) against freshly built `dist/`: **14 matched, 0 mismatches**. The live deployment is this candidate. |
| API rate limit | A 200-request concurrent invalid-license burst to production `/verify` completed in 1,595 ms: **30× 200**, **162× 429 Retry-After: 4**, **8× 429 Retry-After: 3**. Rate limiting begins at approximately the 31st concurrent request; this requirement now passes. |

## Tool notes

`npx @axe-core/cli` could not launch because this container has Playwright
Chromium but no Selenium-discoverable Chrome binary.  This is not a page error:
the repository’s `@axe-core/playwright` integration was run locally and against
the live URL as recorded above.  A fresh Lighthouse invocation likewise could
not attach to the container browser; bundle transfer measurements, response
policy, and the production Axe/Playwright checks completed normally.

## Required next actions

1. Add a complete `.factory/claims.json`, one observable demo-entry test per
   claim, and run every listed command from clean state.
2. Implement `/demo` or `?demo=1` with realistic bundled sample data, a first
   screen **Try it with sample data** action, persistent demo banner/reset/start
   controls, a distinct `demo:` storage namespace, and `.factory/demo.md`.
3. Rewrite the first screen so it plainly names the intended operator and the
   action to take first.
4. Enable/register the production Sociobot checkout product or remove the
   unavailable paid offer until it is usable.
5. Add robots, sitemap, and a true 404 route.

No product source was modified during verification.
