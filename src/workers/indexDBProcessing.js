// javascript
import { read, utils } from 'xlsx';

self.onmessage = async function (event) {
  const file = event.data;
  try {
    // read file as binary string
    const data = await readFileAsBinaryString(file);

    // parse workbook
    const workbook = read(data, { type: 'binary' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // convert sheet to array-of-arrays (first row assumed header)
    const jsonData = utils.sheet_to_json(worksheet, { header: 1 });

    if (!jsonData || jsonData.length <= 1) {
      self.postMessage({ status: 'error', message: 'No rows found' });
      return;
    }

    // prepare IndexedDB
    const db = await openDB('dhrDB', 1);

    // determine total rows (excluding header)
    const totalRows = jsonData.length - 1;

    const batchSize = 1000; // tune this value based on memory/throughput
    let processed = 0;

    // iterate rows skipping header
    for (let i = 1; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      const records = batch.map((row) => {
        return {
          // adapt indices to your actual file format
          EMP_ID: row[0],
          NAME: row[2],
          EMAIL: row[39],
          MANAGER_EMP_ID: row[35],
          MANAGER_NAME: row[36],
          // optionally store additional fields
        };
      }).filter(r => r.EMAIL); // keep only those with email (as in your original code)

      // write batch to IndexedDB
      await addRecordsBatch(db, 'employees', records);

      processed += records.length;
      // notify main thread progress
      self.postMessage({ status: 'progress', processed, total: totalRows });
    }

    self.postMessage({ status: 'success', count: processed });
  } catch (err) {
    self.postMessage({ status: 'error', message: err && err.message ? err.message : String(err) });
  }
};

// helper: read file as binary string (FileReader)
function readFileAsBinaryString(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsBinaryString(file);
  });
}

// IndexedDB helpers (available in worker)
function openDB(name, version = 1) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (evt) => {
      const db = evt.target.result;
      if (!db.objectStoreNames.contains('employees')) {
        // use EMP_ID as key if it's unique, otherwise use autoIncrement
        const store = db.createObjectStore('employees', { keyPath: 'EMP_ID' });
        store.createIndex('EMAIL', 'EMAIL', { unique: false });
        // add other indexes you plan to query by (e.g., MANAGER_EMP_ID)
        store.createIndex('MANAGER_EMP_ID', 'MANAGER_EMP_ID', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function addRecordsBatch(db, storeName, records) {
  if (!records || records.length === 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    for (const rec of records) {
      // use put() so updates succeed if keys already exist
      store.put(rec);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
