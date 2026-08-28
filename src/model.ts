export type Item = {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  location: string;
  expected: number;
};

export type Count = {
  itemId: string;
  counted: number;
  reason: string;
  note: string;
  photo?: string;
  updatedAt: string;
};

export type AuditEvent = {
  at: string;
  action: string;
  itemId?: string;
  detail: string;
  counter?: string;
};

export type StocktakeState = {
  version: 1;
  sessionId: string;
  title: string;
  startedAt: string;
  updatedAt: string;
  items: Item[];
  counts: Record<string, Count>;
  audit: AuditEvent[];
  counter: string;
};

export const emptyState = (): StocktakeState => ({
  version: 1,
  sessionId: crypto.randomUUID(),
  title: 'Physical stock count',
  startedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [], counts: {}, audit: [], counter: ''
});
