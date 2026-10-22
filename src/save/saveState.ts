export const SAVE_VERSION = 1;

export interface SaveState {
  schemaVersion: number;
  currentLevelId: string;
  unlockedLevelIds: string[];
  completedLevelIds: string[];
  completedMiniGameIds: string[];
  claimedRewardIds: string[];
  savedAt: string | null;
}

export function createInitialSaveState(
  startingLevelId: string
): SaveState {
  return {
    schemaVersion: SAVE_VERSION,
    currentLevelId: startingLevelId,
    unlockedLevelIds: [startingLevelId],
    completedLevelIds: [],
    completedMiniGameIds: [],
    claimedRewardIds: [],
    savedAt: null,
  };
}