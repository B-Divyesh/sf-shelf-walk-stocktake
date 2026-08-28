# Shelf Walk Stocktake — verification handoff: FAIL

Verification work order: `shelf-walk-stocktake-verify-1`<br>
Candidate: `caf79e653a46e72b32b7a4f3d9d2f6c3c44725c6`<br>
Live URL: <https://shelf-walk-stocktake.sociobot.in><br>
Verified: 2026-08-28

## Status

**FAIL — do not promote this candidate.** A normal stock shortage exports its
numeric variance as the literal text `'-2`, rather than numeric `-2`. This is a P1
failure of the brief’s import-ready variance artifact: the consumer must clean up
negative adjustments before import.

See [verification-1.md](verification-1.md) for full, reproducible evidence and all
observations.

## What was verified

- Clean clone at the candidate SHA, `npm ci`, `npm test` (4/4), exact
  `npm run build`, and `npm run test:e2e` (4/4) all passed.
- The complete live `dist/` artifact set SHA-256 matches this candidate.
- Desktop and 390 px mobile normal count, shelf-order search, invalid CSV/recovery,
  maximum rows, barcode fallback, keyboard focus, dark/reduced motion, axe,
  privacy/network scope, offline reload, and update notification were exercised.
- No console/page errors or axe serious/critical findings were observed.

## Other issues to resolve

- **P2:** live responses lack `Content-Security-Policy` and `Permissions-Policy`.
- **Advisory:** one Lighthouse 12.8.2 mobile run measured Performance 87 (target
  is 90), despite LCP 1.3 s, CLS 0.019, and Accessibility 100. Re-measure after
  addressing the export bug; responsive hero variants and immutable hashed-asset
  caching are also advisable.

## How to reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

In the app, import a row with expected `12`, record counted `10` with a variance
reason, then export Variance CSV. The `variance` column will be `'-2`.

No product code was changed by the verifier.
