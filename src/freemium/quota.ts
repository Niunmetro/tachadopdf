import type { QuotaStatus } from '../types';

// 5 documentos/mes gratis. OJO: este contador vive en IndexedDB local y es RESETEABLE (borrando
// datos del navegador / incógnito). No es —ni puede ser— un muro: la app no tiene servidor ni
// cuentas a propósito (nada sale del navegador). Es un umbral de conveniencia sostenido por
// honradez. El muro DE VERDAD contra el uso profesional gratis es FREE_MAX_PAGES (ver abajo).
export const FREE_MONTHLY_LIMIT = 5;

// Tope de páginas por documento en la versión gratuita. A diferencia del contador, esto SÍ es un
// muro robusto: se aplica en CADA uso, lo reseteen o no, y el trabajo real (actas de comunidad,
// listados de morosos, expedientes) tiene muchas páginas → el profesional necesita Pro sí o sí.
// La versión gratuita sigue siendo un test HONESTO: tacha de verdad hasta este número de páginas.
export const FREE_MAX_PAGES = 3;

const DB_NAME = 'tachadopdf-freemium';
const DB_VERSION = 1;
const STORE_NAME = 'quota';

function monthKey(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readCount(db: IDBDatabase, key: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(typeof request.result === 'number' ? request.result : 0);
    request.onerror = () => reject(request.error);
  });
}

function writeCount(db: IDBDatabase, key: string, count: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(count, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getQuota(now: Date = new Date()): Promise<QuotaStatus> {
  const db = await openDb();
  const usedThisMonth = await readCount(db, monthKey(now));
  db.close();
  return {
    usedThisMonth,
    limit: FREE_MONTHLY_LIMIT,
    allowed: usedThisMonth < FREE_MONTHLY_LIMIT,
  };
}

export async function recordUse(now: Date = new Date()): Promise<void> {
  const db = await openDb();
  const key = monthKey(now);
  const current = await readCount(db, key);
  await writeCount(db, key, current + 1);
  db.close();
}
