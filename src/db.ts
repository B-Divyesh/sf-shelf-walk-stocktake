import type { StocktakeState } from './model';

const REAL_DB = 'shelf-walk-stocktake';
const DEMO_DB = 'demo:shelf-walk-stocktake';
const STORE = 'local-data';
const SNAPSHOTS = 'snapshots';
let databaseName = REAL_DB;

/** Select storage before the app reads or writes any stocktake data. */
export function useDemoStorage(isDemo: boolean): void {
  databaseName = isDemo ? DEMO_DB : REAL_DB;
}

export function activeDatabaseName(): string { return databaseName; }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      if (!request.result.objectStoreNames.contains(SNAPSHOTS)) request.result.createObjectStore(SNAPSHOTS, { keyPath: 'savedAt' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearActiveStorage(): Promise<void> {
  const name = databaseName;
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

export async function saveSnapshot(state: StocktakeState): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(SNAPSHOTS, 'readwrite');
    const store = tx.objectStore(SNAPSHOTS);
    const put = store.put({ savedAt: new Date().toISOString(), state });
    put.onsuccess = () => {
      const keys = store.getAllKeys();
      keys.onsuccess = () => (keys.result as string[]).sort().slice(0, -5).forEach((key) => store.delete(key));
    };
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  }).finally(() => db.close());
}

export async function listSnapshots(): Promise<Array<{ savedAt: string; state: StocktakeState }>> {
  const db = await openDb();
  return new Promise<Array<{ savedAt: string; state: StocktakeState }>>((resolve, reject) => {
    const request = db.transaction(SNAPSHOTS).objectStore(SNAPSHOTS).getAll();
    request.onsuccess = () => resolve((request.result as Array<{ savedAt: string; state: StocktakeState }>).sort((a,b) => b.savedAt.localeCompare(a.savedAt)).slice(0, 5));
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function loadState(): Promise<StocktakeState | undefined> {
  const db = await openDb();
  return new Promise<StocktakeState | undefined>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get('active');
    request.onsuccess = () => resolve(request.result as StocktakeState | undefined);
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function saveState(state: StocktakeState): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(state, 'active');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }).finally(() => db.close());
}
