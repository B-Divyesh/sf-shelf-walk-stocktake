# Shelf Walk Stocktake — independent verification handoff

- Work order: `shelf-walk-stocktake-verify-2`
- Tested candidate: `9a15463a197fbd693d6c154dae920b9f8e6cf71d`
- Live URL: <https://shelf-walk-stocktake.sociobot.in>
- Full report: [`.factory/verification-2.md`](verification-2.md)
- Verified: 2026-08-28

## Status

**FAIL — do not promote this candidate.** The live deployment matches the candidate
byte-for-byte and the repaired numeric variance export and response headers pass,
but three release-blocking findings remain:

1. **P1:** the manual barcode fallback's “Find item” and “Close scanner” controls
   do not work because the dialog is outside the delegated event-handler root.
2. **P1:** the advertised production Pro checkout returns HTTP 404 with
   `{"error":"enabled factory product","status":404}`.
3. **P1:** 180 rapid production verify requests all returned 200; no 429,
   `Retry-After`, or rate-limit threshold was observed.

There is also a **P2 accessibility defect**: the required CSV input receives focus
while clipped/invisible, and activating the skip link leaves focus on `BODY`. Small
mobile footer targets and 30-second caching on hashed assets are P3 findings.

## What passed

- Clean `npm ci`; 8/8 unit tests; strict typecheck; exact production build; 12/12
  Playwright desktop/mobile tests; production dependency audit.
- Representative shelf walk, full-path duplicate choice via ordinary search,
  reason validation, numeric variance/audit CSVs, photo note persistence/removal,
  JSON backup/restore, erase confirmation and CSV limits through 10,000 rows.
- True offline reload with persisted state, installed-worker update toast, valid
  manifest, zero console/page errors, and only expected first-party/Sociobot
  requests.
- Live Axe serious/critical: zero on landing, count, dark/reduced-motion mobile and
  legal pages. Lighthouse mobile: 100/100/100/100; LCP 1.4 s, TBT 30 ms, CLS 0.019.
- All 14 local public build files match live SHA-256. CSP, Permissions Policy, HSTS,
  referrer policy, `nosniff`, frame denial and manifest MIME are live.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run test:e2e
npm audit --omit=dev
```

For the scanner defect, remove `window.BarcodeDetector`, import any valid CSV, open
“Scan barcode”, type a barcode, and activate “Find item”; it navigates/reloads and
does not search. Clicking “Close scanner” is also a no-op, while Escape works.

## Next steps

Fix both scanner-dialog controls and add regression coverage; enable the production
Sociobot product; enforce API burst limiting with 429 plus `Retry-After`; then repair
the keyboard focus issues and repeat independent live verification. No product code
was changed by this verifier.
