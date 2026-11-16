
/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from 'vitest';
import { SaveManager } from '../../src/save/saveManager.ts';
import { BrowserStorageAdapter } from '../../src/save/browserStorageAdapter.ts';

describe('SaveManager', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('starts with default progress when no save exists', async () => {
        const manager = await SaveManager.load(
            new BrowserStorageAdapter(),
            'level-1'
        );

        const save = manager.getState();

        expect(save.currentLevelId).toBe('level-1');
        expect(save.unlockedLevelIds).toEqual(['level-1']);
        expect(save.completedLevelIds).toEqual([]);
    });

    it('saves level completion and unlocks the next level', async () => {
        const manager = await SaveManager.load(
            new BrowserStorageAdapter(),
            'level-1'
        );

        await manager.completeLevel('level-1', 'level-2');

        const save = manager.getState();

        expect(save.completedLevelIds).toContain('level-1');
        expect(save.unlockedLevelIds).toContain('level-2');
        expect(save.currentLevelId).toBe('level-2');
    });

    it('restores progress through a new manager', async () => {
        const storage = new BrowserStorageAdapter();

        const first = await SaveManager.load(storage, 'level-1');

        await first.completeLevel('level-1', 'level-2');

        const second = await SaveManager.load(
            new BrowserStorageAdapter(),
            'level-1'
        );

        expect(second.getState().currentLevelId).toBe('level-2');
        expect(second.getState().completedLevelIds).toContain('level-1');
    });

    it('records completed minigame progress', async () => {
        const manager = await SaveManager.load(
            new BrowserStorageAdapter(),
            'level-1'
        );

        await manager.completeMinigame('memory-game', 2, 100);

        const progress = manager.getState().miniGames['memory-game'];

        expect(progress.completed).toBe(true);
        expect(progress.attempts).toBe(2);
        expect(progress.bestScore).toBe(100);
    });

    it('does not duplicate completed levels', async () => {
        const manager = await SaveManager.load(
            new BrowserStorageAdapter(),
            'level-1'
        );

        await manager.completeLevel('level-1', 'level-2');
        await manager.completeLevel('level-1', 'level-2');

        expect(manager.getState().completedLevelIds).toEqual(['level-1']);
        expect(manager.getState().unlockedLevelIds).toEqual([
            'level-1',
            'level-2'
        ]);
    });
});
