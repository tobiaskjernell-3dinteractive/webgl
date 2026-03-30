/**
 * IndexedDB Storage Tracker
 * Monitors IndexedDB usage for browser cache
 */

export interface IndexedDBInfo {
  totalSize: number;
  estimatedQuota: number;
  usagePercent: number;
}

/**
 * Get IndexedDB storage usage using the Storage Quota API
 * Falls back to estimation if API is not available
 */
export async function getIndexedDBSize(): Promise<IndexedDBInfo> {
  // Try using Storage Quota API (most accurate)
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        totalSize: estimate.usage || 0,
        estimatedQuota: estimate.quota || 0,
        usagePercent: estimate.quota ? (estimate.usage! / estimate.quota) * 100 : 0,
      };
    } catch (error) {
      console.warn('Failed to get storage estimate:', error);
    }
  }

  // Fallback: estimate by iterating through IndexedDB databases
  return estimateIndexedDBSize();
}

/**
 * Estimate IndexedDB size by iterating through all databases
 * Note: This is an approximation and may not include all data
 */
async function estimateIndexedDBSize(): Promise<IndexedDBInfo> {
  try {
    let totalSize = 0;

    // Get all database names (if available in IDBFactory)
    const databases = await (indexedDB as any).databases?.();

    if (databases && Array.isArray(databases)) {
      for (const dbInfo of databases) {
        try {
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(dbInfo.name);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });

          // Get all object stores
          for (let i = 0; i < db.objectStoreNames.length; i++) {
            const storeName = db.objectStoreNames[i];
            const storeSize = await getObjectStoreSize(db, storeName);
            totalSize += storeSize;
          }

          db.close();
        } catch (error) {
          console.warn(`Failed to get size for database ${dbInfo.name}:`, error);
        }
      }
    }

    return {
      totalSize,
      estimatedQuota: 0,
      usagePercent: 0,
    };
  } catch (error) {
    console.warn('Failed to estimate IndexedDB size:', error);
    return {
      totalSize: 0,
      estimatedQuota: 0,
      usagePercent: 0,
    };
  }
}

/**
 * Get the size of a specific object store
 */
function getObjectStoreSize(db: IDBDatabase, storeName: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const items = getAllRequest.result;
        let size = 0;

        items.forEach((item) => {
          // Rough estimation: stringify and measure byte size
          try {
            const json = JSON.stringify(item);
            size += json.length * 2; // 2 bytes per character (UTF-16)
          } catch {
            // If can't stringify, estimate 1KB per item
            size += 1024;
          }
        });

        resolve(size);
      };

      getAllRequest.onerror = () => {
        resolve(0);
      };
    } catch (error) {
      console.warn('Error getting object store size:', error);
      resolve(0);
    }
  });
}

/**
 * Monitor IndexedDB size with a callback
 * Returns a cleanup function
 */
export function watchIndexedDBSize(
  callback: (info: IndexedDBInfo) => void,
  intervalMs: number = 2000
): () => void {
  const interval = setInterval(async () => {
    const info = await getIndexedDBSize();
    callback(info);
  }, intervalMs);

  return () => clearInterval(interval);
}

/**
 * Clear all IndexedDB databases
 * Use with caution!
 */
export async function clearAllIndexedDB(): Promise<void> {
  try {
    const databases = await (indexedDB as any).databases?.();

    if (databases && Array.isArray(databases)) {
      for (const dbInfo of databases) {
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(dbInfo.name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      }
    }
  } catch (error) {
    console.warn('Failed to clear IndexedDB:', error);
  }
}
