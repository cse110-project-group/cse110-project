
export const SAVE_VERSION = 1;

// Individual game progress
export interface MiniGameProgress {
  completed: boolean;
  attempts: number;
  bestScore?: number;
}

// Player progress
export interface SaveState {
  schemaVersion: number;

  // Main game progress
  currentLevelId: string;
  unlockedLevelIds: string[];
  completedLevelIds: string[];

  // Minigame progress with ID
  miniGames: Record<string, MiniGameProgress>;

  // Gift/Rewards ID
  claimedRewardIds: string[];
  savedAt: string;
}

// Save Template, tweak later
export function createInitialSaveState(
  startingLevelId: string
): SaveState {
  return {
    schemaVersion: SAVE_VERSION,
    currentLevelId: startingLevelId,
    unlockedLevelIds: [startingLevelId],
    completedLevelIds: [],
    miniGames: {},
    claimedRewardIds: [],
    savedAt: new Date().toISOString()
  };
}
