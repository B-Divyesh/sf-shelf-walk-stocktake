# Shelf Walk Stocktake — verification 5 handoff

- Work order: `shelf-walk-stocktake-verify-5`
- Implementation candidate: `564bc98faaf02d7c494531121748da51c31dc0d2`
- Documentation candidate before this report: `7e1fb8127c867a56b3c80530911eed1855c4e70b`
- Live URL: <https://shelf-walk-stocktake.sociobot.in>
- Verified: 2026-09-06

## Status: FAIL

Independent QA found **3 findings** and **4 untested public claims**. Product
behavior, all seven declared claims, local/live suites, artifact identity,
accessibility checks, offline behavior, and performance passed. Acceptance still
fails because public promises lack the required claim-tagged sandbox tests and
the mandatory site metadata and shared page structure are incomplete.

See [`.factory/verification-5.md`](verification-5.md) for evidence and exact
required work.

## What was verified

- Clean candidate checkout at `564bc98`: `npm ci`, `npm test` (10/10),
  `npm run typecheck`, `npm run build`, `npm audit --omit=dev`, and
  `git diff --check` passed.
- Every exact command in `.factory/claims.json` passed separately in desktop and
  phone Chromium: 7 claims, 14/14 executions.
- Full Playwright suites passed 32/32 locally and 32/32 against live HTTPS.
- Live matches all 18 public build artifacts by SHA-256.
- Fresh desktop and phone first screens name the stock-count job, the intended
  audience, and **Try it with sample data** before scrolling.
- Demo label, realistic sample, reset, start-real, same-origin requests, and
  strict separation from a real-data sentinel all passed.
- Normal, invalid, boundary, photo, backup, erase, restore, scanner, keyboard,
  focus, dark, reduced-motion, offline, update, legal, links, and 404 paths were
  exercised.
- URL checker and Playwright Axe checks passed with no violations in the tested
  route set and no console/page errors.
- Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100;
  LCP 1.4 s, CLS 0.019, TBT 0 ms, 88 KiB transfer.

## Findings to repair

1. Add claim inventory entries and tagged demo tests for photo/reason persistence,
   formula-safe export, full backup including photo notes, and complete audit
   events/full paths, or remove those public promises.
2. Add canonical, Open Graph, Twitter, Apple touch, and 1200×630 social-image
   metadata to all routes.
3. Restore the required common header/footer on legal and 404 pages, plus the
   required three first-screen facts and landing privacy/non-goal section.

No product source was changed. Only this handoff and the verification report were
added or updated. The current product has no advertised paid offer; billing remains
out of scope unless that offer is restored.
