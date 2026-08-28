import type { Item } from './model';

/** A realistic six-SKU hardware counter sample, bundled for offline demo use. */
const sampleRows: Array<[string, string, string, string, number]> = [
  ['FIX-100', 'M8 hex nuts', '8901111111111', 'Aisle 01 / Bay 02 / Shelf A', 120],
  ['FIX-220', 'M8 flat washers', '8901111111128', 'Aisle 01 / Bay 02 / Shelf B', 180],
  ['TAP-010', '48 mm carton tape', '8902222222222', 'Aisle 02 / Bay 01 / Shelf A', 24],
  ['GLV-004', 'Nitrile gloves, medium', '8903333333333', 'Aisle 02 / Bay 03 / Shelf C', 36],
  ['CAB-050', 'Cable ties, 200 mm', '8904444444444', 'Aisle 10 / Bay 01 / Shelf B', 75],
  ['CLN-012', 'Workshop cleaner, 1 L', '8905555555555', 'Aisle 10 / Bay 04 / Shelf A', 12]
];

export const sampleItems = (): Item[] => sampleRows.map(([sku, name, barcode, location, expected]) => ({
  id: `${sku}\u001f${location}`, sku, name, barcode, location, expected
})).sort((a, b) => a.location.localeCompare(b.location, undefined, { numeric: true }) || a.sku.localeCompare(b.sku));
