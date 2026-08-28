# Shelf Walk Stocktake

Shelf Walk is a local-first PWA for a single-location wholesaler, workshop, or
retailer doing a physical stock count. Start with the bundled sample or import a
plain item/location CSV. It is a count pass, not an ERP, POS, or valuation tool.

Live: <https://shelf-walk-stocktake.sociobot.in>

## Try the sample

Open [the demo](https://shelf-walk-stocktake.sociobot.in/demo/) for a six-item
hardware shelf count. It is separate from real work and can be reset at any
time. See [`.factory/demo.md`](.factory/demo.md) for its storage boundary.

## Verified product claims

- Counts sample items in natural full shelf-path order.
- Exports variance and audit CSV files.
- Works offline after the first visit.
- Keeps stocktake data in this browser with no analytics or cloud inventory storage.
- Finds an item by typing its barcode when camera scanning is unavailable.

Each claim is mapped to an isolated browser regression in
[`.factory/claims.json`](.factory/claims.json). Run all claim checks with
`npm run test:claims`.

## CSV format

UTF-8 comma-separated files up to 2 MB / 10,000 item rows are accepted.

```csv
sku,name,barcode,location,expected
SKU-001,Hex nuts,8901234567890,Aisle 01 / Bay 02 / Shelf B,12
```

`sku`, `location`, and a non-negative numeric `expected` value are required.
`name` and `barcode` are optional. Download the template from the import screen
if your headings differ.

## Develop and verify

Requires Node.js 20+.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
npm run test:e2e
```

The exact production build command is `npm run build`. Output lands in `dist/`
with `dist/index.html` at its root. End-to-end tests use Playwright 1.58.2 and
exercise a 390px-class mobile flow, Axe accessibility checks and offline reload.
To run the same suite against a deployed environment without starting a local
preview server, set `E2E_BASE_URL`, for example:

```sh
E2E_BASE_URL=https://shelf-walk-stocktake.sociobot.in npm run test:e2e
```

## Deploy

Deploy the contents of `dist/` as an Azure Static Web App. The shipped
`staticwebapp.config.json` supplies CSP, Permissions-Policy, a PWA manifest MIME
type, a styled 404 response, and immutable one-year caching for hashed assets.
Do not add secrets or a payment provider in this repository.

## Data and safety

Count data is kept in browser IndexedDB. Clearing site data removes it. See
[Privacy](https://shelf-walk-stocktake.sociobot.in/privacy/) and
[Terms](https://shelf-walk-stocktake.sociobot.in/terms/).

Visual rationale and generated-asset provenance are in
[`.factory/design.md`](.factory/design.md). The implementation is MIT licensed.
