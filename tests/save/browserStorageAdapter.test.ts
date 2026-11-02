
/* @vitest-environment jsdom */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserStorageAdapter } from '../../src/save/browserStorageAdapter.ts';
import { createInitialSaveState } from '../../src/save/saveState.ts';

describe('BrowserStorageAdapter', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('returns null when no save exists', async () => {
		const storage = new BrowserStorageAdapter();

		expect(await storage.read('save-1')).toBeNull();
	});

	it('saves and retrieves data', async () => {
		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', 'level-2');

		expect(await storage.read('save-1')).toBe('level-2');
	});

	it('overwrites existing save data', async () => {
		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', 'level-1');
		await storage.write('save-1', 'level-3');

		expect(await storage.read('save-1')).toBe('level-3');
	});

	it('deletes saved data', async () => {
		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', 'progress');
		await storage.remove('save-1');

		expect(await storage.read('save-1')).toBeNull();
	});

	it('keeps different save slots separate', async () => {
		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', 'level-1');
		await storage.write('save-2', 'level-5');

		await storage.remove('save-1');

		expect(await storage.read('save-1')).toBeNull();
		expect(await storage.read('save-2')).toBe('level-5');
	});

	it('shares saved data across adapter instances', async () => {
		const first = new BrowserStorageAdapter();

		await first.write('save-1', 'completed');

		const second = new BrowserStorageAdapter();

		expect(await second.read('save-1')).toBe('completed');
	});

	it('saves and restores complete game progress', async () => {
		const storage = new BrowserStorageAdapter();
		const save = createInitialSaveState('level-1');

		save.currentLevelId = 'level-2';
		save.completedLevelIds.push('level-1');
		save.unlockedLevelIds.push('level-2');

		save.miniGames['memory-game'] = {
			completed: true,
			attempts: 2,
			bestScore: 100,
		};

		await storage.write('player-save', JSON.stringify(save));

		const anotherStorage = new BrowserStorageAdapter();
		const savedData = await anotherStorage.read('player-save');

		expect(savedData).not.toBeNull();
		expect(JSON.parse(savedData!)).toEqual(save);
	});

	it('uses a prefix for game save keys', async () => {
		const storage = new BrowserStorageAdapter();

		await storage.write('save-1', 'progress');

		expect(localStorage.getItem('cse110-game-saves:save-1')).toBe('progress');
		expect(localStorage.getItem('save-1')).toBeNull();
	});

	it('reports an error when localStorage is unavailable', async () => {
		vi.stubGlobal('localStorage', undefined);

		const storage = new BrowserStorageAdapter();

		await expect(storage.read('save-1')).rejects.toThrow(
			'Browser storage is unavailable'
		);

		await expect(storage.write('save-1', 'progress')).rejects.toThrow(
			'Browser storage is unavailable'
		);
	});

	it('reports storage quota errors', async () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Storage full', 'QuotaExceededError');
		});

		const storage = new BrowserStorageAdapter();

		await expect(storage.write('save-1', 'progress')).rejects.toThrow(
			'Storage full'
		);
	});
});
