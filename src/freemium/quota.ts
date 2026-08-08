import type { QuotaStatus } from '../types';

// 5 documentos/mes gratis. OJO: este contador vive en IndexedDB local y es RESETEABLE (borrando
// datos del navegador / incógnito). No es —ni puede ser— un muro: la app no tiene servidor ni
// cuentas a propósito (nada sale del navegador). Es un umbral de conveniencia sostenido por
// honradez.
export const FREE_MONTHLY_LIMIT = 5;

// Tope de páginas por documento en la versión gratuita.
//
// AQUÍ HUBO UNA PREMISA FALSA, y se corrige porque sostenía una decisión de negocio: este comentario
// decía que el tope de páginas «SÍ es un muro robusto: se aplica en CADA uso, lo reseteen o no».
// No lo es. `withinFreePageLimit` es `s.license.pro || pageCount <= maxPages`, y `s.license.pro`
// lo enciende la misma verificación de licencia que corre en el navegador del usuario: cuatro
// líneas en la consola que devuelvan `{success:true}` a la llamada de Gumroad activan el Pro
// entero — tope de páginas, lote y marca de agua del informe caen juntos. Reproducido.
//
// En un producto SIN SERVIDOR esto no tiene arreglo técnico, y no se pretende: el compromiso de
// que ningún documento sale del navegador es más valioso que el candado. Lo que sí hacía daño era
// el comentario, porque hacía creer que había un muro donde solo hay una convención. El freemium
// se sostiene en que la versión gratuita es HONESTA (tacha de verdad) y en que el comprador es un
// profesional que no va a falsificar su propia licencia.
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
