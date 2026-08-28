# Shelf Walk Stocktake — verification handoff

- Work order: `shelf-walk-stocktake-verify-4`
- Candidate: `6230dd4b088be3b0c86ba31761414dd272e67f5b`
- Live URL: <https://shelf-walk-stocktake.sociobot.in>
- Verified: 2026-08-28

## Status: FAIL

The deployed candidate works end to end and matches the candidate build, but it
does not meet the factory claims contract. The visible and README promise of
CSV imports up to **2 MB / 10,000 rows** has no `.factory/claims.json` entry and
no quantitative `@claim:` sandbox test. Unlisted claims fail this review.

The full evidence, declared-claim results, security/privacy/PWA checks, and
repair requirement are in [`.factory/verification-4.md`](verification-4.md).

## Verification commands

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run test:e2e -- --workers=1
E2E_BASE_URL=https://shelf-walk-stocktake.sociobot.in npm run test:e2e -- --workers=1
```

All six currently declared claim commands passed individually; see the report
for their exact commands and sandbox evidence. No product source was modified
during verification. Add and pass the missing capacity claim test (or remove
the numerical promise), then repeat this independent verification.
