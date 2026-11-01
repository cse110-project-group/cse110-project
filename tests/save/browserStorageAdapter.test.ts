
/* @vitest-environment jsdom */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { BrowserStorageAdapter } from '../../src/save/browserStorageAdapter.ts';
import { createInitialSaveState } from '../../src/save/saveState.ts';

describe('BrowserStorageAdapter', () => {


	// fake IndexedDB instance created so tests do not affect one another.
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('indexedDB', new IDBFactory());
	});

	// Reset to default after each test
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	// Test 1: No valid key returns null
	it('returns null when no save exists', async () => {
		const storage = new BrowserStorageAdapter();

		expect(await storage.read('save-1')).toBeNull();
	});

	// Test 2: Basic storing and retrival into IndexedDB
	it('saves and retrieves progress using IndexedDB', async () => {
		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', '{"level":2}');

		expect(await storage.read('save-1')).toBe('{"level":2}');

		// Make sure IndexedDB was used instead of localStorage
		expect(localStorage.getItem('save-1')).toBeNull();
	});

	// Test 3: Overriting a value through same key
	it('overwrites existing save data', async () => {
		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', 'level-1');
		await storage.write('save-1', 'level-2');

		expect(await storage.read('save-1')).toBe('level-2');
	});

	// Test 4: Deletion of data through saved key
	it('deletes saved progress', async () => {
		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', 'progress');
		await storage.remove('save-1');

		expect(await storage.read('save-1')).toBeNull();
	});

	// Test 5: Data should be saved once a new BrowserStorageAdapter instance is made
	it('shares persistent data across adapter instances', async () => {
		const first = new BrowserStorageAdapter();

		await first.write('save-1', 'completed');

		const second = new BrowserStorageAdapter();

		expect(await second.read('save-1')).toBe('completed');
	});

	// Test 6: If IndexedDB is not working/unavailable, local storage should be used
	it('uses localStorage when IndexedDB is unavailable', async () => {
		vi.stubGlobal('indexedDB', undefined);

		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', 'fallback-data');

		expect(localStorage.getItem('save-1')).toBe('fallback-data');
		expect(await storage.read('save-1')).toBe('fallback-data');

		await storage.remove('save-1');

		expect(await storage.read('save-1')).toBeNull();
	});

	// Test 7: If opening IndexedDB throws an error then should switch to local
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

	// Test 8: Combines #81 and #82, trial run of the saving system

	it('saves and restores complete game progress', async () => {
		const storage = new BrowserStorageAdapter();

		// Create a new player save starting at level 1
		const save = createInitialSaveState('level-1');

		// Simulate completing level 1 and unlocking level 2
		save.currentLevelId = 'level-2';
		save.completedLevelIds.push('level-1');
		save.unlockedLevelIds.push('level-2');

		// Simulate progress from a completed minigame
		save.miniGames['memory-game'] = {
			completed: true,
			attempts: 2,
			bestScore: 100,
		};

		// Convert our SaveState object into a JSON string
		// Our StorageAdapter stores strings, not objects
		const serializedSave = JSON.stringify(save);

		// Store the progress in IndexedDB
		await storage.write('player-save', serializedSave);

		// Create another adapter to simulate loading progress
		// from a separate part of the application.
		const newStorage = new BrowserStorageAdapter();

		const storedData = await newStorage.read('player-save');

		// Verify that saved data was found
		expect(storedData).not.toBeNull();

		// Convert the JSON string back into an object
		const restoredSave = JSON.parse(storedData!);

		// Verify that the saved progress matches the original
		expect(restoredSave).toEqual(save);
		expect(restoredSave.currentLevelId).toBe('level-2');
		expect(restoredSave.completedLevelIds).toContain('level-1');
		expect(restoredSave.miniGames['memory-game'].bestScore).toBe(100);
	});

	// Test 9: Verify that multiple save slots can exist independently without overwriting one another
	it('stores multiple save slots independently', async () => {
		const storage = new BrowserStorageAdapter();

		// Store progress under two different keys.
		await storage.write('save-1', 'level-1');
		await storage.write('save-2', 'level-5');

		expect(await storage.read('save-1')).toBe('level-1');
		expect(await storage.read('save-2')).toBe('level-5');

		// Deleting the first save should not affect the second.
		await storage.remove('save-1');

		expect(await storage.read('save-1')).toBeNull();
		expect(await storage.read('save-2')).toBe('level-5');
	});

	// Test 10: Verify that the adapter reports an error when both storage systems are unavailable.
	it('reports an error when all browser storage is unavailable', async () => {

		// Simulate a browser environment without IndexedDB
		// or localStorage.
		vi.stubGlobal('indexedDB', undefined);
		vi.stubGlobal('localStorage', undefined);

		const storage = new BrowserStorageAdapter();

		// Attempting to write should reject with an error.
		await expect(
			storage.write('save-1', 'progress')
		).rejects.toThrow('Browser storage is unavailable');

		// Attempting to read should also reject.
		await expect(
			storage.read('save-1')
		).rejects.toThrow('Browser storage is unavailable');
	});

	// Test 11: Verify that localStorage errors are reported rather than silently ignored.
	it('reports localStorage write failures', async () => {

		// Disable IndexedDB to force the localStorage fallback.
		vi.stubGlobal('indexedDB', undefined);

		// Replace localStorage with a mock that throws an error
		// whenever the game attempts to save data.
		//
		// This simulates situations such as storage being full.
		vi.stubGlobal('localStorage', {
			getItem: vi.fn(),
			removeItem: vi.fn(),
			setItem: vi.fn(() => {
				throw new DOMException(
					'Storage quota exceeded',
					'QuotaExceededError'
				);
			}),
		});

		const storage = new BrowserStorageAdapter();

		// The adapter should propagate the storage error.
		// This allows the game to notify the player that
		// their progress could not be saved.
		await expect(
			storage.write('save-1', 'progress')
		).rejects.toThrow('Storage quota exceeded');
	});
});
