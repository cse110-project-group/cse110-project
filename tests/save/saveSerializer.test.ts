
import { describe, expect, it } from 'vitest';

import {
    createInitialSaveState,
    SAVE_VERSION,
} from '../../src/save/saveState.ts';

import {
    isSaveState,
    serializeSaveState,
    deserializeSaveState,
} from '../../src/save/saveSerializer.ts';

describe('Save serialization', () => {
    it('serializes and restores valid game progress', () => {
        const save = createInitialSaveState('level-1');

        save.currentLevelId = 'level-2';
        save.completedLevelIds.push('level-1');
        save.unlockedLevelIds.push('level-2');

        save.miniGames['memory-game'] = {
            completed: true,
            attempts: 2,
            bestScore: 100,
        };

        const json = serializeSaveState(save);
        const restored = deserializeSaveState(json, 'level-1');

        expect(restored).toEqual(save);
    });

    it('accepts minigames without best scores', () => {
        const save = createInitialSaveState('level-1');

        save.miniGames['maze-game'] = {
            completed: false,
            attempts: 1,
        };

        expect(isSaveState(save)).toBe(true);
    });

    it('creates a default save when no save exists', () => {
        const restored = deserializeSaveState(null, 'level-1');

        expect(restored.currentLevelId).toBe('level-1');
        expect(restored.completedLevelIds).toEqual([]);
        expect(restored.schemaVersion).toBe(SAVE_VERSION);
    });

    it('falls back when JSON is corrupted', () => {
        const restored = deserializeSaveState(
            '{invalid json',
            'level-1'
        );

        expect(restored.currentLevelId).toBe('level-1');
        expect(restored.miniGames).toEqual({});
    });

    it('falls back when required fields are missing', () => {
        const invalid = JSON.stringify({
            schemaVersion: SAVE_VERSION,
            currentLevelId: 'level-3',
        });

        const restored = deserializeSaveState(invalid, 'level-1');

        expect(restored.currentLevelId).toBe('level-1');
    });

    it('rejects incorrectly typed progress', () => {
        const invalid = {
            ...createInitialSaveState('level-1'),
            completedLevelIds: 'level-1',
        };

        expect(isSaveState(invalid)).toBe(false);
    });

    it('rejects invalid minigame data', () => {
        const invalid = {
            ...createInitialSaveState('level-1'),
            miniGames: {
                'memory-game': {
                    completed: 'yes',
                    attempts: -2,
                },
            },
        };

        expect(isSaveState(invalid)).toBe(false);
    });

    it('falls back for older schema versions', () => {
        const oldSave = {
            ...createInitialSaveState('level-3'),
            schemaVersion: SAVE_VERSION - 1,
        };

        const restored = deserializeSaveState(
            JSON.stringify(oldSave),
            'level-1'
        );

        expect(restored.schemaVersion).toBe(SAVE_VERSION);
        expect(restored.currentLevelId).toBe('level-1');
    });

    it('falls back for newer unsupported versions', () => {
        const futureSave = {
            ...createInitialSaveState('level-3'),
            schemaVersion: SAVE_VERSION + 1,
        };

        const restored = deserializeSaveState(
            JSON.stringify(futureSave),
            'level-1'
        );

        expect(restored.currentLevelId).toBe('level-1');
        expect(restored.schemaVersion).toBe(SAVE_VERSION);
    });

    it('rejects invalid saves during serialization', () => {
        const invalid = createInitialSaveState('level-1');
        invalid.savedAt = 'not-a-date';

        expect(() => serializeSaveState(invalid)).toThrow(
            'Invalid save state'
        );
    });
});
