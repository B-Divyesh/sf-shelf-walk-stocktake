# Independent verification 4 — Shelf Walk Stocktake

- **Candidate commit:** `6230dd4b088be3b0c86ba31761414dd272e67f5b`
- **Live URL:** <https://shelf-walk-stocktake.sociobot.in>
- **Verified:** 2026-08-28
- **Scope:** clean install; every declared claim through the demo entry point;
  local and deployed test suites; cold-read, desktop and 390×844 mobile use;
  PWA/offline; accessibility; privacy/network; response policy, cache and
  artifact identity.

## Verdict: FAIL

The deployed application is functional and the six declared claims pass, but
the candidate fails the supplied claims acceptance contract. The landing page
and README promise that CSV imports accept **up to 2 MB / 10,000 item rows**.
That quantitative promise is not listed in `.factory/claims.json` and has no
tagged sandbox test measuring either limit. The claims rules require every
visitor-facing promise to be listed, and require quantitative claims to assert
their number; they explicitly make an unlisted claim a failing review finding.

No product code was changed in this verification.

## Release-blocking finding

### P0 — unlisted, unmeasured CSV import-capacity claim

Fresh cold landing copy says: **“Max 10,000 rows / 2 MB.”** README repeats:
**“UTF-8 comma-separated files up to 2 MB / 10,000 item rows are accepted.”**
The six entries in `.factory/claims.json` cover the demo, shelf order, exports,
offline operation, local privacy, and manual barcode fallback, but none covers
the CSV capacity claim. The unit tests do not create 10,000/10,001 rows or
measure the 2 MB accept/reject boundary, and no `@claim:` test does so.

This is a claims-contract failure, not evidence that the runtime limits are
wrong: source inspection shows intended guards. It must be repaired by either
adding one observable, tagged demo-entry claim test for the exact documented
limits (including a boundary/rejection assertion), or removing the numerical
promise from visitor-facing copy and README. Until then, the candidate cannot
be accepted.

## Required claims: all declared entries passed

After `npm ci` from this clean checkout, each exact `test` command in
`.factory/claims.json` was run separately. Each rebuilds production `dist/`
and executes the test from `/demo/` in both declared Chromium projects.

| Claim | Exact command suffix | Result / observable evidence |
| --- | --- | --- |
| `demo-sandbox` | `--grep @claim:demo-sandbox` | PASS, 2/2: six-item sample, banner/reset/start-real controls, `demo:shelf-walk-stocktake`, no real database. |
| `shelf-order` | `--grep @claim:shelf-order` | PASS, 2/2: first shelf `Aisle 01 / Bay 02 / Shelf A`, then full `Shelf B` path after saving. |
| `csv-export` | `--grep @claim:csv-export` | PASS, 2/2: variance has full path and numeric `-2`; audit CSV has timestamp header. |
| `offline-reload` | `--grep @claim:offline-reload` | PASS, 2/2: controlled service worker, offline reload retains sample count. |
| `privacy-local` | `--grep @claim:privacy-local` | PASS, 2/2: demo data in demo IndexedDB and only same-origin requests. |
| `manual-barcode` | `--grep @claim:manual-barcode` | PASS, 2/2: manual entry resolves bundled barcode without `BarcodeDetector`. |

## What passed

| Check | Fresh evidence |
| --- | --- |
| Clean install and repository quality gates | `npm ci` installed 59 packages with 0 reported vulnerabilities. `npm test` passed **10/10**. `npm run typecheck`, exact `npm run build`, `git diff --check`, and `npm audit --omit=dev` all passed. |
| Complete browser suite | `npm run test:e2e -- --workers=1` passed **30/30** against the freshly built local `dist/`. `E2E_BASE_URL=https://shelf-walk-stocktake.sociobot.in npm run test:e2e -- --workers=1` also passed **30/30** live, covering desktop and 390×844 mobile. |
| Cold first read | A new live browser saw **“Count stock in one local stockroom.”** It says it is for wholesalers, workshops, and retailers, and offers **“Try it with sample data”** as the clear first click. That link opens `/demo/` in one click. |
| Representative use and recovery | Manual live mobile demo: counted 118 against 120 with reason Damaged, attached a PNG photo note, advanced from full Shelf A to Shelf B, manually barcode-found `Aisle 10 / Bay 04 / Shelf A`, and downloaded `variances-1748e145.csv`. Negative count shows `Enter a count of zero or more.` Negative expected input shows the row-specific non-negative error; an unterminated quote reports the malformed CSV error. |
| Demo boundary and privacy | Fresh `/demo/` displayed `Demo — sample data, nothing is saved to your real stocktake`, reset/start-real controls, `0 / 6`, and no horizontal overflow at 390 px. Its complete captured request list was only the same-origin demo document and local JS/CSS assets; there were no console or page errors. |
| Accessibility and keyboard | The live 30-test suite’s `@axe-core/playwright` WCAG 2 A/AA scans reported **0 serious/critical** violations on landing, active count (including dark/reduced-motion), legal pages, and demo. Tests cover skip link, designed focus, 44px navigation targets, scanner dialog trap/escape/focus restoration, labels, and denied-camera manual entry. The manual reduced-motion check returned transition duration `0s`. |
| PWA | Live suite passed service-worker-controlled offline reload after first visit and update notification `An update is ready. Reload to use it.` Manifest is served as `application/manifest+json` and declares standalone, 192/512 maskable icons and versioned start URL. |
| Deployment identity | SHA-256 compared the 18 publicly served artifacts in fresh `dist/` (HTML, JS/CSS, image, icons, manifest, SW, offline/404/legal/crawl pages) to production: **18/18 exact matches**. `staticwebapp.config.json` itself is intentionally not publicly served (404); its deployed effects were independently confirmed through response headers and 404 behavior. |
| Security, privacy and cache headers | Root and assets return HSTS, restrictive self CSP, camera-only Permissions-Policy, `nosniff`, strict referrer policy and frame denial. No third-party requests, scripts, fonts or analytics were observed. A hashed main asset has `Cache-Control: public, max-age=31536000, immutable`; HTML revalidates at 30 seconds. `/does-not-exist` returns HTTP 404 and the styled 404 title. |
| Performance budget | Production build: main JS 24,390 B raw / 9,178 B gzip; CSS 16,606 B raw / 4,361 B gzip; hero WebP 70,794 B; no web fonts. All are within the supplied static/PWA budgets. |

## Not applicable

This static PWA has no product server endpoints, purchase/unlock flow, or
sign-in flow. Browser network capture showed only static same-origin requests,
so no API rate-limit allowance or Entra tenant check applies.

## Repair and re-verification

1. Add an `import-capacity` claim to `.factory/claims.json` and an exact tagged
   Playwright demo-entry test that asserts documented 2 MB and 10,000-row
   acceptance plus the corresponding over-limit rejection, or remove both
   numerical promises.
2. Re-run every listed claim command from a clean install, then re-run the
   local and live browser suites after deployment.
