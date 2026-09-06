# Copy audit — 2026-09-06

## Landing page

| Text | Words | Result |
| --- | ---: | --- |
| Offline stock count · no ERP required | 6 | Pass |
| Count stock in one local stockroom. | 6 | Pass |
| For wholesalers, workshops, and retailers who need a shelf-ordered count without an ERP. | 13 | Pass |
| Import shelf-list CSV | 3 | Pass |
| Try it with sample data | 5 | Pass |
| Download CSV template | 3 | Pass |
| Try the six-item hardware shelf count first, or import your own CSV. | 12 | Pass |
| Required: sku, location, expected. | 4 | Pass |
| Optional: name, barcode. | 3 | Pass |
| Max 10,000 rows / 2 MB. | 5 | Pass — measured by `@claim:import-capacity` |
| Full shelf paths stay visible on every count. | 8 | Pass |
| Count in four steps | 4 | Pass |
| How the stocktake works | 4 | Pass |
| Bring a plain CSV from any inventory system. | 8 | Pass |
| Scan or search without losing shelf order. | 7 | Pass |
| Reason codes and photo notes stay attached. | 7 | Pass |
| Only variances, plus a complete audit trail. | 7 | Pass |
| Local stock counts in this browser. | 6 | Pass — covered by `@claim:privacy-local` |
| Built by Param Factory · v1.0.1 | 6 | Pass |

No landing sentence exceeds 22 words or uses a banned word. The numeric import
limit is listed in `.factory/claims.json` and exercised through the demo import
flow.

## Terminology

| Concept | Product term |
| --- | --- |
| Physical stock count | stocktake |
| Shelf identifier | full shelf path |
| Data file | CSV |
| Sample environment | demo |
| Difference from expected | variance |
