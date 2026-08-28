import type { Item, StocktakeState } from './model';

export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (char !== '\r') field += char;
  }
  if (quoted) throw new Error('A quoted field is not closed. Check the CSV near the end.');
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

const names: Record<string, string[]> = {
  sku: ['sku', 'item', 'item code', 'code'],
  name: ['name', 'item name', 'description'],
  barcode: ['barcode', 'ean', 'upc', 'gtin'],
  location: ['location', 'shelf', 'shelf path', 'bin'],
  expected: ['expected', 'expected qty', 'quantity', 'qty', 'system count']
};

export function importItems(input: string): Item[] {
  if (new Blob([input]).size > 2_000_000) throw new Error('That file is over 2 MB. Split it into smaller shelf lists.');
  const rows = parseCsv(input.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('The CSV needs a header and at least one item row.');
  if (rows.length > 10_001) throw new Error('This count supports up to 10,000 items per file.');
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const index = (key: string) => header.findIndex((h) => names[key].includes(h));
  const sku = index('sku'), location = index('location'), expected = index('expected');
  if ([sku, location, expected].some((i) => i < 0)) throw new Error('Missing required columns: sku, location, expected. Download the template to see the format.');
  const name = index('name'), barcode = index('barcode');
  const seen = new Set<string>();
  const items = rows.slice(1).map((cells, rowIndex) => {
    const itemSku = (cells[sku] ?? '').trim();
    const itemLocation = (cells[location] ?? '').trim();
    const qtyText = (cells[expected] ?? '').trim();
    const qty = Number(qtyText);
    if (!itemSku || !itemLocation || qtyText === '' || !Number.isFinite(qty) || qty < 0) {
      throw new Error(`Row ${rowIndex + 2}: sku, location and a non-negative expected count are required.`);
    }
    const id = `${itemSku}\u001f${itemLocation}`;
    if (seen.has(id)) throw new Error(`Row ${rowIndex + 2}: duplicate SKU and location (${itemSku} at ${itemLocation}).`);
    seen.add(id);
    return { id, sku: itemSku, location: itemLocation, expected: qty, name: (cells[name] ?? '').trim(), barcode: (cells[barcode] ?? '').trim() };
  });
  return items.sort((a, b) => a.location.localeCompare(b.location, undefined, { numeric: true }) || a.sku.localeCompare(b.sku, undefined, { numeric: true }));
}

const safe = (value: unknown) => {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

export function toCsv(rows: unknown[][]): string {
  return `${rows.map((row) => row.map(safe).join(',')).join('\r\n')}\r\n`;
}

export function varianceCsv(state: StocktakeState): string {
  const rows: unknown[][] = [['sku','name','barcode','location','expected','counted','variance','reason','note','counted_at']];
  for (const item of state.items) {
    const count = state.counts[item.id];
    if (count && count.counted !== item.expected) rows.push([item.sku,item.name,item.barcode,item.location,item.expected,count.counted,count.counted-item.expected,count.reason,count.note,count.updatedAt]);
  }
  return toCsv(rows);
}

export function auditCsv(state: StocktakeState): string {
  const rows: unknown[][] = [['timestamp','session_id','counter','action','sku','location','detail']];
  for (const event of state.audit) {
    const item = state.items.find((i) => i.id === event.itemId);
    rows.push([event.at,state.sessionId,event.counter ?? state.counter,event.action,item?.sku ?? '',item?.location ?? '',event.detail]);
  }
  return toCsv(rows);
}
