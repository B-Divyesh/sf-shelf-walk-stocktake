# Shelf Walk Stocktake — repair handoff

- Work order: `shelf-walk-stocktake-repair-3`
- Base verified: `488ee8991a312b600679306250529b40767a86e2`
- Independent report repaired: [`.factory/verification-3.md`](verification-3.md)
- Verified locally: 2026-08-28
- Artifact/deployment class: static offline PWA; `dist/` root output

## Status: PASS locally

All four release blockers and the reported crawl defect are repaired without
changing the count, scanner, import, review, or export workflow.

1. `.factory/claims.json` maps six visitor-facing claims to one tagged,
   observable Playwright test each. `npm run test:claims -- --workers=1` ran all
   six claims on desktop and exact 390×844 mobile: 12 passed.
2. `/demo/` and `/?demo=1` seed a realistic six-item hardware shelf count in
   `demo:shelf-walk-stocktake`, never in production
   `shelf-walk-stocktake` IndexedDB. The persistent banner has **Reset demo**
   and **Start for real**; starting for real deletes the demo database.
   [`.factory/demo.md`](demo.md) documents the sample and boundary.
3. The cold landing now says who it is for and exposes **Try it with sample
   data** next to the CSV import. Its headline, target audience sentence, and
   action are browser-regressed.
4. The unavailable ₹799 checkout and all Pro/license UI were removed. Core
   count, photo, and CSV behavior remains free and covered end to end.
5. `robots.txt`, `sitemap.xml`, `404.html`, and Static Web Apps 404 response
   override are shipped. The previous app-shell navigation fallback is removed.

## Exact verification evidence

```sh
npm ci                                      # 59 packages; 0 vulnerabilities
npm run typecheck                           # pass
npm test                                    # 10/10 pass
npm run build                               # pass; dist/index.html exists
npm run test:claims -- --workers=1          # 12/12 pass (desktop + 390×844)
npm run test:e2e -- --workers=1             # 30/30 pass (desktop + 390×844)
npm audit --omit=dev                        # 0 vulnerabilities
git diff --check                            # pass
```

The browser suite exercises import/count/review/export, keyboard skip link,
focus state, scanner fallback, denied-camera recovery, dialog focus return,
service-worker update notice, offline reload, privacy request capture, demo
reset/start-real boundary, and Axe WCAG 2 A/AA checks. Axe reports zero
serious/critical violations on landing, active count in dark/reduced-motion,
Privacy, Terms, and Demo in both Chromium projects.

Built transfer sizes: main JS 24,390 B raw / 9,178 B gzip; CSS 16,606 B raw /
4,361 B gzip. They are below the static-PWA 200 KB JS and 50 KB CSS budgets.
`/`, `/demo/`, `/robots.txt`, and `/sitemap.xml` returned 200 from the fresh
production build preview. Azure Static Web Apps rewrites unknown-path 404
responses to the shipped styled `404.html` through `responseOverrides`.

`verify-url.sh` was not present in this repository. Its title/lang/one-h1/main,
alt/name, console-error, keyboard, and Axe checks are covered by the committed
Playwright suite instead. The repository uses `@axe-core/playwright` against the
built app.

## Deployment

The work-order deployment mechanism is the static `main` branch build. Push the
repair commit to `origin/main`; the factory static deployment should publish the
fresh `dist/` output. No deployment credentials or direct static-host command
are stored in this repository.

## Known gaps / next step

No product gaps are known. After static deploy completes, re-run the live
identity hash comparison and production browser suite against
`https://shelf-walk-stocktake.sociobot.in`.
