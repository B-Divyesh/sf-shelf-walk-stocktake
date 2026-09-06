# Verify an offline shelf stock count — Shelf Walk Stocktake

- Work order: `shelf-walk-stocktake-verify-5`
- Implementation candidate: `564bc98faaf02d7c494531121748da51c31dc0d2`
- Documentation handoff: `7e1fb8127c867a56b3c80530911eed1855c4e70b`
- Live URL: <https://shelf-walk-stocktake.sociobot.in>
- Verified: 2026-09-06
- Environment: clean checkout, Node 22.23.2, Playwright 1.58.2,
  Chromium, Lighthouse 12.8.2

## Verdict: FAIL

There are **3 findings** and **4 untested public claims**. All seven declared
claim commands pass, and the stock-count workflow works locally and live. The
candidate still fails the supplied claims and site-structure contracts. Public
copy promises four outcomes that have no matching claim-tagged demo test. Every
route is also missing required canonical and social metadata, and some required
shared page structure is absent.

No product code was changed during verification.

## Findings

### P0 — four public claims lack required sandbox claim tests

`.factory/claims.json` has seven valid entries, but it does not cover four
visitor-facing promises:

1. Landing: **“Reason codes and photo notes stay attached.”**
2. Finish screen: **“Spreadsheet-formula characters are neutralised on export.”**
3. Finish screen: **“A portable copy of this full stocktake, including photo notes.”**
4. Landing/finish: **“Only variances, plus a complete audit trail”** and
   **“Timestamped import and count events, including full paths.”**

The repository has a unit check for formula neutralisation, and this verification
manually proved photo persistence, backup/restore, and erase recovery. Those facts
do not meet the claims contract: each public promise needs an entry in
`.factory/claims.json` and exactly one outcome-based `@claim:<id>` test through the
demo sandbox. The existing `csv-export` claim checks a variance row and only the
audit header; it does not prove that the exported audit contains the complete
event set and full paths.

Untested claim count: **4**.

### P2 — required canonical and social metadata is absent

Fresh DOM checks on `/`, `/demo/`, `/privacy/`, `/terms/`, and the styled 404
found no `link[rel=canonical]`, Open Graph image, Twitter card, or Apple touch
icon. The built artifact set also has no required product-specific 1200×630
social image. Titles, descriptions, favicon, `lang`, and theme colour are present,
but that does not satisfy the attached site-structure metadata contract.

Lighthouse SEO still scores 100 because it does not enforce these factory-specific
metadata requirements.

### P2 — required shared page and landing structure is incomplete

- Privacy and Terms omit the standard site navigation. Their footers omit the
  product one-line description, **Built by Param Factory**, and the build version.
- The 404 is deliberately returned with HTTP 404 and is usable, but it has no
  standard header or footer.
- The landing page does not provide the required three short privacy, offline,
  and price facts, and it has no separate plain-language privacy/non-goal section
  after **How the stocktake works**.

These omissions do not break the count operation, but they are required by the
attached plain-words and site-structure contracts.

## First screen before scrolling

A fresh 1440×900 desktop context and fresh 390×844 phone context both showed:

- Job: **“Count stock in one local stockroom.”**
- Audience: **“For wholesalers, workshops, and retailers who need a
  shelf-ordered count without an ERP.”**
- First action: **“Try it with sample data.”**

The action ended at CSS pixel 617 on desktop and 554 on phone, inside each first
viewport. Both screens had zero horizontal overflow, one `h1`, `lang=en`, a main
landmark, and no console or page errors. Screenshots are at
`/work/.evidence/live-desktop-first-screen.png` and
`/work/.evidence/live-phone-first-screen.png`.

## Declared claims

Each exact `test` string in `.factory/claims.json` was run separately after
`npm ci` in a clean checkout of the implementation candidate. Every command
rebuilt `dist/` and ran in both configured Chromium projects.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-sandbox` | PASS — 2/2 | Six items, persistent banner, reset/start-real controls, demo database only. |
| `shelf-order` | PASS — 2/2 | Saving Shelf A advances to the full Shelf B path. |
| `csv-export` | PASS — 2/2 | Variance CSV contains full path and numeric `-2`; audit CSV has its timestamp header. |
| `offline-reload` | PASS — 2/2 | Service-worker-controlled demo reloads offline with sample data. |
| `privacy-local` | PASS — 2/2 | Demo count uses the demo database and makes only same-origin requests. |
| `manual-barcode` | PASS — 2/2 | Typed sample barcode resolves when `BarcodeDetector` is absent. |
| `import-capacity` | PASS — 2/2 | Accepts 10,000 rows at 1,999,900 bytes; rejects 10,001 rows and 2,000,001 bytes with the documented errors. |

There are no failed declared claims. The four unlisted claims in the P0 finding
remain untested under the required claim-command contract.

## Build and browser results

| Check | Result |
| --- | --- |
| Clean install | PASS — `npm ci`, 59 packages, 0 vulnerabilities. |
| Unit tests | PASS — `npm test`, 10/10. |
| Type and build | PASS — `npm run typecheck`; `npm run build`; `dist/index.html` produced. |
| Local browser suite | PASS — 32/32 with `--workers=1`. |
| Live browser suite | PASS — 32/32 with `--workers=1`. |
| Dependency and diff checks | PASS — `npm audit --omit=dev`; `git diff --check`. |
| Deployment identity | PASS — all 18 public candidate artifacts match live SHA-256 values. |

## Demo, normal use, invalid input, and recovery

A fresh browser first created a one-item real stocktake as a sentinel. The demo
then loaded six realistic items, kept its label visible in walk, review, and finish
views, saved a shortage, and reset to `0 / 6`. The real database was byte-for-byte
unchanged. **Start for real** deleted the demo database and reopened the sentinel
stocktake. Captured demo requests were same-origin only.

Independent phone checks also passed:

- missing-column CSV error followed by a valid import;
- negative count rejection and missing variance-reason rejection with focus moved
  to the reason field;
- photo-note save across reload, then removal;
- incomplete-walk warning;
- backup download, erase cancel, erase confirm, invalid restore, and valid restore;
- no-result search with a useful recovery message; and
- zero console and page errors throughout.

The full suites additionally cover manual scanning when camera support is absent,
camera-permission denial, focus trapping/restoration, keyboard import and skip-link
focus, 44 px navigation targets, dark colour treatment, and update notification.

## Accessibility, PWA, privacy, routes, and response policy

- `/opt/fleet/lib/verify-url.sh` passed: HTTPS 200 in 637 ms, title, `lang=en`,
  one `h1`, main landmark, no missing image alt text, no unnamed buttons, and no
  console/page errors.
- Playwright Axe WCAG 2 A/AA scans found zero violations on fresh phone views of
  `/`, `/demo/`, `/privacy/`, `/terms/`, and the 404. The repository's local and
  live Axe checks also passed in desktop and phone projects. Standalone Axe CLI
  could not find a Selenium Chrome binary, but this left no accessibility claim
  untested because the Playwright Axe integration completed.
- Reduced-motion produced `0s` transitions and animation. There was no horizontal
  overflow on the tested 390 px views.
- Offline reload and the installed-worker update notice passed locally and live.
- All crawled internal links returned below 400. `/`, `/demo/`, `/privacy/`,
  `/terms/`, `robots.txt`, and `sitemap.xml` return 200 with correct route titles.
  `/does-not-exist` correctly returns HTTP 404 with the designed recovery page.
- Root responses include restrictive CSP, camera-only Permissions Policy, HSTS,
  `nosniff`, strict referrer policy, and frame denial. Hashed assets use one-year
  immutable caching; the manifest uses `application/manifest+json`.
- Fresh normal and demo flows made no third-party requests. No analytics, external
  fonts, or cloud inventory calls were observed.

This is a static PWA with no backend, tenant, sign-in, or advertised paid offer.
Tenant isolation, server restart persistence, health endpoints, API 429 handling,
and billing are not applicable. AI would not improve the physical counting job,
so no missed AI feature was found.

## Performance

Fresh live Lighthouse 12.8.2 scores:

| Performance | Accessibility | Best practices | SEO |
| ---: | ---: | ---: | ---: |
| 100 | 100 | 100 | 100 |

FCP was 0.9 s, LCP 1.4 s, TBT 0 ms, CLS 0.019, and transfer was 88 KiB.
The main JavaScript is 24,666 bytes raw / 9,239 bytes gzip; CSS is 16,606
bytes raw / 4,392 bytes gzip; the hero WebP is 70,794 bytes. All supplied
performance budgets pass.

## Earlier verification findings

| Earlier report | Current disposition |
| --- | --- |
| Verification 1 | Fixed and proved: negative variance remains numeric; CSP and camera policy are live; responsive hero, immutable assets, and 100 performance pass. |
| Verification 2 | Fixed and proved: scanner buttons/manual fallback work, import and skip focus are visible, mobile navigation targets meet 44 px, immutable caching is live. The broken paid offer is removed, so checkout and billing rate limits are not current product paths. |
| Verification 3 | Fixed and proved: declared claims inventory exists, demo uses a separate namespace, first screen names job/audience/action, crawl files return 200, and the designed route returns a real 404. The current P0 finding concerns additional public promises not included in that inventory. |
| Verification 4 | Fixed and proved: `import-capacity` is declared and passes at the stated accepted and rejected boundaries in desktop and phone projects. |

## Required next work

1. Add claim entries and demo-browser tests for the four public promises, or
   remove/limit the corresponding copy.
2. Add canonical, Open Graph, Twitter, Apple touch, and 1200×630 product image
   metadata to every public page as required.
3. Use the standard header/footer on legal and 404 pages. Add the required three
   first-screen facts and the landing privacy/non-goal section.
4. Re-run every claim command and repeat local/live browser verification after a
   new implementation is deployed.
