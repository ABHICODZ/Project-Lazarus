/** Draft persistence: text fields in localStorage, image bytes in IndexedDB (too big for localStorage). */

const DB = 'lazarus-write';
const STORE = 'images';
export const DRAFT_KEY = 'lazarus-write-draft';
export const TOKEN_KEY = 'lazarus-write-token';

export interface StoredImage {
  id: string;
  file: string;
  ident: string;
  alt: string;
  caption: string;
  blob: Blob;
  order: number;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// IndexedDB can be unavailable (private windows, blocked storage). Drafts then just last the session.
const safe = async <T>(fallback: T, fn: () => Promise<T>): Promise<T> => { try { return await fn(); } catch { return fallback; } };

export const putImage = (img: StoredImage) => safe(undefined, () => run('readwrite', (s) => s.put(img)).then(() => undefined));
export const deleteImage = (id: string) => safe(undefined, () => run('readwrite', (s) => s.delete(id)).then(() => undefined));
export const clearImages = () => safe(undefined, () => run('readwrite', (s) => s.clear()).then(() => undefined));
export const allImages = () => safe<StoredImage[]>([], async () => (await run('readonly', (s) => s.getAll())).sort((a, b) => a.order - b.order));

export const readLocal = (key: string): string | null => { try { return localStorage.getItem(key); } catch { return null; } };
export const writeLocal = (key: string, value: string | null) => {
  try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch {}
};
