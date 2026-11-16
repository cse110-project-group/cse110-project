
import {
    SAVE_VERSION,
    type SaveState,
    type MiniGameProgress,
    createInitialSaveState,
} from './saveState';

// Check that a value is an object, not null or an array
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value);
}

// Check that an array only contains strings
function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value)
        && value.every(item => typeof item === 'string');
}

// Validate individual minigame progress
function isMiniGameProgress(value: unknown): value is MiniGameProgress {
    if (!isRecord(value)) {
        return false;
    }

    return typeof value.completed === 'boolean'
        && typeof value.attempts === 'number'
        && Number.isInteger(value.attempts)
        && value.attempts >= 0
        && (
            value.bestScore === undefined
            || (
                typeof value.bestScore === 'number'
                && Number.isFinite(value.bestScore)
            )
        );
}

// Validate a complete save state
export function isSaveState(value: unknown): value is SaveState {
    if (!isRecord(value)) {
        return false;
    }

    if (value.schemaVersion !== SAVE_VERSION) {
        return false;
    }

    return typeof value.currentLevelId === 'string'
        && value.currentLevelId.length > 0
        && isStringArray(value.unlockedLevelIds)
        && isStringArray(value.completedLevelIds)
        && isStringArray(value.claimedRewardIds)
        && isRecord(value.miniGames)
        && Object.values(value.miniGames).every(isMiniGameProgress)
        && typeof value.savedAt === 'string'
        && !Number.isNaN(Date.parse(value.savedAt));
}

// Convert a valid save state into JSON
export function serializeSaveState(save: SaveState): string {
    if (!isSaveState(save)) {
        throw new Error('Invalid save state');
    }

    return JSON.stringify(save);
}

// Restore saved JSON or fall back to a new save
export function deserializeSaveState(
    json: string | null,
    startingLevelId: string
): SaveState {
    if (json === null) {
        return createInitialSaveState(startingLevelId);
    }

    try {
        const parsed: unknown = JSON.parse(json);

        if (isSaveState(parsed)) {
            return parsed;
        }
    } catch {
        // Invalid JSON falls back to a fresh save
    }

    return createInitialSaveState(startingLevelId);
}
