
import type { StorageAdapter } from "./storageAdapter";

export class BrowserStorageAdapter implements StorageAdapter {
  private readonly dbName = "cse110-game-saves";
  private readonly storeName = "saves";

  // Open the IndexedDB database when needed.
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB is unavailable"));
        return;
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = () => resolve(request.result);

      request.onerror = () =>
        reject(request.error ?? new Error("Failed to open IndexedDB"));

      request.onblocked = () =>
        reject(new Error("IndexedDB upgrade is blocked"));
    });
  }

  // Run one IndexedDB operation.
  private async useIndexedDB<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(this.storeName, mode);
        const store = transaction.objectStore(this.storeName);
        const request = operation(store);

        transaction.oncomplete = () => {
          db.close();
          resolve(request.result);
        };

        transaction.onerror = () => {
          db.close();
          reject(transaction.error ?? new Error("IndexedDB failed"));
        };

        transaction.onabort = () => {
          db.close();
          reject(transaction.error ?? new Error("IndexedDB aborted"));
        };
      } catch (error) {
        db.close();
        reject(error);
      }
    });
  }

  // Read previously saved data.
  async read(key: string): Promise<string | null> {
    let localStorageFailed = false;

    try {
      const value = window.localStorage.getItem(key);

      if (value !== null) {
        return value;
      }
    } catch {
      localStorageFailed = true;
    }

    try {
      const value = await this.useIndexedDB<string | undefined>(
        "readonly",
        (store) => store.get(key)
      );

      return value ?? null;
    } catch {
      if (localStorageFailed) {
        throw new Error("Both browser storage methods failed");
      }

      return null;
    }
  }

  // Write data to browser storage.
  async write(key: string, value: string): Promise<void> {
    try {
      window.localStorage.setItem(key, value);

      // Remove any older fallback copy.
      try {
        await this.useIndexedDB("readwrite", (store) =>
          store.delete(key)
        );
      } catch {
        // The localStorage write already succeeded.
      }

      return;
    } catch {
      // Fall back when localStorage cannot write.
    }

    try {
      await this.useIndexedDB("readwrite", (store) =>
        store.put(value, key)
      );
    } catch {
      throw new Error("Unable to save using either storage method");
    }

    // Avoid reading an older localStorage copy later.
    try {
      window.localStorage.removeItem(key);
    } catch {
      // localStorage may be inaccessible.
    }
  }

  // Delete saved data from both storage methods.
  async remove(key: string): Promise<void> {
    let localRemoved = false;
    let indexedRemoved = false;

    try {
      window.localStorage.removeItem(key);
      localRemoved = true;
    } catch {
      // Try IndexedDB.
    }

    try {
      await this.useIndexedDB("readwrite", (store) =>
        store.delete(key)
      );

      indexedRemoved = true;
    } catch {
      // IndexedDB may be unavailable.
    }

    if (!localRemoved || !indexedRemoved) {
      throw new Error("Could not confirm deletion from all storage");
    }
  }
}
