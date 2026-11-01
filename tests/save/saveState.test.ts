
import { describe, expect, it } from 'vitest';
import {
	createInitialSaveState,
	SAVE_VERSION,
} from '../../src/save/saveState.ts';

describe('SaveState', () => {
	it('creates a valid initial save', () => {
		const save = createInitialSaveState('level-1');

		expect(save.schemaVersion).toBe(SAVE_VERSION);
		expect(save.currentLevelId).toBe('level-1');
		expect(save.unlockedLevelIds).toEqual(['level-1']);
		expect(save.completedLevelIds).toEqual([]);
		expect(save.miniGames).toEqual({});
		expect(save.claimedRewardIds).toEqual([]);
		expect(Number.isNaN(Date.parse(save.savedAt))).toBe(false);
	});

	it('allows different starting levels', () => {
		const save = createInitialSaveState('level-2');

		expect(save.currentLevelId).toBe('level-2');
		expect(save.unlockedLevelIds).toEqual(['level-2']);
	});

	it('tracks multiple minigames independently', () => {
		const save = createInitialSaveState('level-1');

		save.miniGames['memory-game'] = {
			completed: true,
			attempts: 2,
			bestScore: 100,
		};

		save.miniGames['maze-game'] = {
			completed: false,
			attempts: 1,
		};

		expect(save.miniGames['memory-game'].completed).toBe(true);
		expect(save.miniGames['memory-game'].bestScore).toBe(100);
		expect(save.miniGames['maze-game'].completed).toBe(false);
		expect(Object.keys(save.miniGames)).toHaveLength(2);
	});

	it('creates independent save states', () => {
		const save1 = createInitialSaveState('level-1');
		const save2 = createInitialSaveState('level-1');

		save1.completedLevelIds.push('level-1');
		save1.miniGames['memory-game'] = {
			completed: true,
			attempts: 1,
		};

		expect(save2.completedLevelIds).toEqual([]);
		expect(save2.miniGames).toEqual({});
	});

	it('preserves progress after JSON serialization', () => {
		const save = createInitialSaveState('level-1');

		save.miniGames['memory-game'] = {
			completed: true,
			attempts: 3,
			bestScore: 80,
		};

		const serialized = JSON.stringify(save);
		const restored = JSON.parse(serialized);

		expect(restored).toEqual(save);
	});
});
