
/* @vitest-environment jsdom */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { BrowserStorageAdapter } from '../../src/save/browserStorageAdapter.ts';

describe('BrowserStorageAdapter', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('indexedDB', new IDBFactory());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns null when no save exists', async () => {
		const storage = new BrowserStorageAdapter();

		expect(await storage.read('save-1')).toBeNull();
	});

	it('saves and retrieves progress using IndexedDB', async () => {
		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', '{"level":2}');

		expect(await storage.read('save-1')).toBe('{"level":2}');
		expect(localStorage.getItem('save-1')).toBeNull();
	});

	it('overwrites existing save data', async () => {
		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', 'level-1');
		await storage.write('save-1', 'level-2');

		expect(await storage.read('save-1')).toBe('level-2');
	});

	it('deletes saved progress', async () => {
		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', 'progress');
		await storage.remove('save-1');

		expect(await storage.read('save-1')).toBeNull();
	});

	it('shares persistent data across adapter instances', async () => {
		const first = new BrowserStorageAdapter();

		await first.write('save-1', 'completed');

		const second = new BrowserStorageAdapter();

		expect(await second.read('save-1')).toBe('completed');
	});

	it('uses localStorage when IndexedDB is unavailable', async () => {
		vi.stubGlobal('indexedDB', undefined);

		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', 'fallback-data');

		expect(localStorage.getItem('save-1')).toBe('fallback-data');
		expect(await storage.read('save-1')).toBe('fallback-data');

		await storage.remove('save-1');

		expect(await storage.read('save-1')).toBeNull();
	});

	it('falls back if opening IndexedDB throws', async () => {
		vi.stubGlobal('indexedDB', {
			open: () => {
				throw new Error('IndexedDB unavailable');
			},
		});

		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', 'backup');

		expect(await storage.read('save-1')).toBe('backup');
		expect(localStorage.getItem('save-1')).toBe('backup');
	});
});
