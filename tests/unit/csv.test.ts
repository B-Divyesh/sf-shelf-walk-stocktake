import { describe, expect, it } from 'vitest';
import { auditCsv, importItems, parseCsv, varianceCsv } from '../../src/csv';
import { emptyState } from '../../src/model';

describe('CSV handling', () => {
  it('parses quoted commas, newlines and escaped quotes', () => {
    expect(parseCsv('a,b\r\n"one, two","line 1\nline 2"\n"say ""hi""",x')).toEqual([
      ['a','b'], ['one, two','line 1\nline 2'], ['say "hi"','x']
    ]);
  });

  it('normalises headers and sorts in natural shelf order', () => {
    const items = importItems('Item Code,Description,EAN,Shelf Path,System Count\nB2,Bolts,222,Aisle 10 / B,4\nA1,Nuts,111,Aisle 2 / A,8');
    expect(items.map((item) => item.sku)).toEqual(['A1','B2']);
    expect(items[0].location).toBe('Aisle 2 / A');
  });

  it('rejects unsafe or ambiguous import rows', () => {
    expect(() => importItems('sku,location,expected\nA,A1,nope')).toThrow(/Row 2/);
    expect(() => importItems('sku,location,expected\nA,A1,1\nA,A1,2')).toThrow(/duplicate/i);
  });

  it('exports only variances and neutralises spreadsheet formula input', () => {
    const state = emptyState();
    state.items = [
      {id:'1',sku:'=BAD',name:'Nails',barcode:'',location:'A1',expected:3},
      {id:'2',sku:'OK',name:'Tape',barcode:'',location:'A2',expected:2}
    ];
    state.counts['1']={itemId:'1',counted:1,reason:'Damaged',note:'',updatedAt:'2026-01-01T00:00:00Z'};
    state.counts['2']={itemId:'2',counted:2,reason:'',note:'',updatedAt:'2026-01-01T00:00:00Z'};
    expect(varianceCsv(state)).toContain("'=BAD");
    expect(varianceCsv(state)).not.toContain('Tape');
    state.audit.push({at:'2026-01-01T00:00:00Z',action:'count',itemId:'1',detail:'done'});
    expect(auditCsv(state)).toContain('A1');
  });
});
