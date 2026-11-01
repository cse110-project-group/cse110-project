
import type { StorageAdapter } from './storageAdapter';

export class BrowserStorageAdapter implements StorageAdapter {
    // DB Name
	private readonly dbName = 'cse110-game-saves';

    //Object name
	private readonly storeName = 'saves';

    //Opens the DB 
	private readonly dbPromise = this.openDatabase();

	// Rely on IndexedDB first then local storage as fallback
	private openDatabase(): Promise<IDBDatabase | null> {

        //type checking for browser compatitbility 
		if (typeof indexedDB === 'undefined') {
			return Promise.resolve(null);
		}

		return new Promise((resolve) => {

            // holds DB Request 
			let request: IDBOpenDBRequest;

			try {
                //tries to open version one of DB
				request = indexedDB.open(this.dbName, 1);
			} catch {
                //prompts fallback local storage if fails
				resolve(null);
				return;
			}
            
            // tracks if fallback is being used or not
			let usingFallback = false;

			const fallback = () => {
				usingFallback = true;
				resolve(null);
			};
            
            // Instaniates a new DB
			request.onupgradeneeded = () => {

                // Get DB associated with open req
				const db = request.result;

                // Avoid Duplication
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName);
				}
			};
            
            // Successful Run Instance
			request.onsuccess = () => {
				const db = request.result;

                // Closes any IndexDB instances if Fallback is used
				if (usingFallback) {
					db.close();
					return;
				}
                
                // Allow for most recent version of DB to be utilizied
				db.onversionchange = () => db.close();
				resolve(db);
			};
            
            // Any error results in fallback
			request.onerror = fallback;
			request.onblocked = fallback;
		});
	}

	// Implementing the use of Local Storage instead of IndexedDB
	private getLocalStorage(): Storage {
		if (typeof localStorage === 'undefined') {
			throw new Error('Browser storage is unavailable');
		}

		return localStorage;
	}

	// Execute an IndexedDB operation inside a transaction.
	private runTransaction<T>(
		db: IDBDatabase,
		mode: IDBTransactionMode,
		operation: (store: IDBObjectStore) => IDBRequest<T>
	): Promise<T> {
		return new Promise((resolve, reject) => {
			try {
                // Saves object store is created, readonly and readwrite 
				const transaction = db.transaction(
					this.storeName,
					mode
				);
                
                // returns current object store of transaction
				const store = transaction.objectStore(
					this.storeName
				);

                //placeholder for any command/call
				const request = operation(store);

                //outcome of call
				let result!: T;
                
                // if command is successful save result
				request.onsuccess = () => {
					result = request.result;
				};

                // Resolve when entire transaction completes
				transaction.oncomplete = () => resolve(result);

                // reject operation if transaction fails
				transaction.onerror = () => {
					reject(
						transaction.error ??
						new Error('Storage operation failed')
					);
				};

                // Reject if transaction is aborted
				transaction.onabort = () => {
					reject(
						transaction.error ??
						new Error('Storage transaction aborted')
					);
				};
			} catch (error) {
                // safety net for any error
				reject(error);
			}
		});
	}

	// Retrieve previously saved data by key
	async read(key: string): Promise<string | null> {

        // wait for IndexedDB
		const db = await this.dbPromise;

        // if not open, use local
		if (!db) {
			return this.getLocalStorage().getItem(key);
		}

        // read stored value from IndexedDB
		const value = await this.runTransaction(
			db,
			'readonly',
			(store) => store.get(key)
		);

        //if not a string return type then throw null
		return typeof value === 'string' ? value : null;
	}

	// Save or overwrite data.
	async write(key: string, value: string): Promise<void> {
        // wait for Intialization of DB
		const db = await this.dbPromise;

        // fallback to local if not opened
		if (!db) {
			this.getLocalStorage().setItem(key, value);
			return;
		}

        // start a readwrite, put writes over a key/entry
		await this.runTransaction(
			db,
			'readwrite',
			(store) => store.put(value, key)
		);
	}

	// Delete saved data.
	async remove(key: string): Promise<void> {
		const db = await this.dbPromise;

		if (!db) {
			this.getLocalStorage().removeItem(key);
			return;
		}

		await this.runTransaction(
			db,
			'readwrite',
            // removes for given key
			(store) => store.delete(key)
		);
	}
}
