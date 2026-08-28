# Shelf Walk Stocktake

Shelf Walk is a local-first PWA for a single-location wholesaler, workshop or
retailer doing a physical stock count. It imports a plain item/location CSV,
keeps the full shelf path visible, supports barcode camera scan or keyboard
search, records counts/reasons/photo notes, and exports a variance-only file plus
a timestamped audit trail. It is a count pass, not an ERP, POS or valuation tool.

Live: <https://shelf-walk-stocktake.sociobot.in>

## What works

- Natural shelf-path ordering, including numeric segments such as Aisle 2 before Aisle 10.
- Camera barcode detection where the browser supports `BarcodeDetector`, with a manual barcode field everywhere else.
- Explicit location choice when the same barcode occurs on multiple shelves.
- IndexedDB persistence across refresh, tab close and installed-app use.
- Local, compressed photo notes; reason codes required for a variance.
- CSV injection-safe variance and audit exports, and complete JSON backup/restore.
- Numeric expected, counted and variance fields remain numeric in exports, including shortages.
- Installable app shell with an explicitly tested offline reload.
- Free core workflow. The optional ₹799 one-time Pro license adds a named counter to audit events and five on-device restorable checkpoints.

No analytics, runtime CDNs, third-party fonts or cloud inventory storage are used.
The only external request is a daily Sociobot license verification when a user
has entered a Pro token.

## CSV format

UTF-8 comma-separated files up to 2 MB / 10,000 item rows are accepted.

```csv
sku,name,barcode,location,expected
SKU-001,Hex nuts,8901234567890,Aisle 01 / Bay 02 / Shelf B,12
```

`sku`, `location` and a non-negative numeric `expected` value are required.
`name` and `barcode` are optional. A SKU may appear at multiple locations, but a
SKU/location pair must be unique. Common headings such as `item code`, `EAN`,
`shelf path` and `system count` are recognised. A template is downloadable from
the empty state.

## Develop and verify

Requires Node.js 20+.

```sh
npm install
npm run dev
npm test
npm run typecheck
npm run build
npm run test:e2e
```

The exact production build command is `npm run build`. Output lands in `dist/`
with `dist/index.html` at its root. End-to-end tests use Playwright 1.58.2 and
exercise a 390px-class mobile flow, Axe accessibility checks and offline reload.

## Deploy

Deploy the contents of `dist/` as an Azure Static Web App. The shipped
`staticwebapp.config.json` supplies clean-directory fallback, CSP,
Permissions-Policy and the PWA manifest MIME type. Do not add secrets or a
payment provider in this repository. Checkout and token verification use the
hosted Sociobot API for the product slug `shelf-walk-stocktake`; the factory
registers that product separately.

## Data and safety

Count data is kept in the browser's IndexedDB. Clearing site data removes it, so
operators should download the audit CSV and a JSON backup before closing out a
count. Camera permission is requested only after choosing “Scan barcode”. See
[Privacy](https://shelf-walk-stocktake.sociobot.in/privacy/) and
[Terms](https://shelf-walk-stocktake.sociobot.in/terms/).

Visual rationale and generated-asset provenance are in
[`.factory/design.md`](.factory/design.md). The implementation is MIT licensed.
