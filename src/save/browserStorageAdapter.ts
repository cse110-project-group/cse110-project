
import type { StorageAdapter } from './storageAdapter';

export class BrowserStorageAdapter implements StorageAdapter {
	private readonly prefix = 'cse110-game-saves:';

	// Make sure localStorage is available
	private getStorage(): Storage {
		if (typeof localStorage === 'undefined') {
			throw new Error('Browser storage is unavailable');
		}

		return localStorage;
	}

	// Keep game saves separate from other browser data
	private getKey(key: string): string {
		return `${this.prefix}${key}`;
	}

	// Retrieve saved data
	async read(key: string): Promise<string | null> {
		return this.getStorage().getItem(this.getKey(key));
	}

	// Save or overwrite data
	async write(key: string, value: string): Promise<void> {
		this.getStorage().setItem(this.getKey(key), value);
	}

	// Delete saved data
	async remove(key: string): Promise<void> {
		this.getStorage().removeItem(this.getKey(key));
	}
}
