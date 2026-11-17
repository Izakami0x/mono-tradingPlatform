const DB_NAME = 'mono-workspace';
const DB_VERSION = 1;
const STORE_NAME = 'records';

function openDatabase() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open local database'));
    request.onblocked = () => reject(new Error('Local database upgrade is blocked by another tab'));
  });
}

export async function readLocalRecord(key) {
  let db;
  try {
    db = await openDatabase();
    if (!db) return null;
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error || new Error('Unable to read local record'));
    });
  } finally {
    db?.close();
  }
}

export async function writeLocalRecord(key, value) {
  let db;
  try {
    db = await openDatabase();
    if (!db) return false;
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(value, key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Unable to save local record'));
      transaction.onabort = () => reject(transaction.error || new Error('Local save was aborted'));
    });
    return true;
  } finally {
    db?.close();
  }
}
