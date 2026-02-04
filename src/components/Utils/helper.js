export function openDBPromise(name, version = 1) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (evt) => {
      const db = evt.target.result;
      if (!db.objectStoreNames.contains('employees')) {
        const store = db.createObjectStore('employees', { keyPath: 'EMP_ID' });
        store.createIndex('EMAIL', 'EMAIL', { unique: false });
        store.createIndex('MANAGER_EMP_ID', 'MANAGER_EMP_ID', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}