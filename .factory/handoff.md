# Shelf Walk Stocktake — verification handoff

- Work order: `shelf-walk-stocktake-verify-3`
- Candidate commit: `488ee8991a312b600679306250529b40767a86e2`
- Live URL: <https://shelf-walk-stocktake.sociobot.in>
- Independent report: [`.factory/verification-3.md`](verification-3.md)
- Verified: 2026-08-28

## Status: **FAIL**

The deployed bytes match the candidate and the free stock-count flow passes
clean-install, build, desktop/mobile browser, accessibility, offline/update,
privacy-network, cache, and rate-limit checks.  The candidate is nevertheless
not releasable: `.factory/claims.json` is missing, there is no isolated one-click
sample-data demo, the cold first screen fails the supplied plain-words/demo
acceptance test, and the visible ₹799 Pro checkout returns 404.

## Verification summary

```sh
npm ci                 # passed; 0 vulnerabilities
npm test               # passed: 9/9
npm run typecheck      # passed
npm run build          # passed; dist/ produced
npm audit --omit=dev   # passed; 0 vulnerabilities
```

Fresh Playwright runs passed 18/18 against both the freshly built local PWA and
the live URL at desktop plus exact 390×844 mobile.  They cover import/count/
variance export, invalid input, scanner fallback and denied camera, keyboard,
reduced motion, Axe serious/critical, true offline reload, and service-worker
update notification.  All 14 public artifacts in `dist/` SHA-256 matched live.
The production verify endpoint now rate-limits: a 200-request burst returned 30
HTTP 200 and 170 HTTP 429 with `Retry-After: 3` or `4` seconds.

## Release blockers / next steps

1. Create and execute the required `.factory/claims.json` entries from the demo
   entry point; remove or test every visitor-facing claim.
2. Add a realistic, one-click **Try it with sample data** demo with `/demo` or
   `?demo=1`, `demo:` storage isolation, persistent reset/start-real banner,
   and `.factory/demo.md`.  At present `?demo=1` writes to normal
   `shelf-walk-stocktake` IndexedDB.
3. State the target operator and first action in plain words on the cold first
   screen.
4. Enable the advertised Sociobot checkout (currently 404) or remove the paid
   offer until it works.
5. Add robots/sitemap and a real 404 response.

No product source was changed during this verification.
