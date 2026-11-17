
import {
    SAVE_VERSION,
    type SaveState,
    type MiniGameProgress,
    createInitialSaveState,
} from './saveState';

const SAVE_FIELDS = new Set([
    'schemaVersion',
    'currentLevelId',
    'unlockedLevelIds',
    'completedLevelIds',
    'miniGames',
    'claimedRewardIds',
    'savedAt',
]);

const MINIGAME_FIELDS = new Set([
    'completed',
    'attempts',
    'bestScore',
]);

// Check that a value is an object, not null or an array
function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value);
}

// Reject unexpected fields
function hasOnlyKeys(
    value: Record<string, unknown>,
    allowed: ReadonlySet<string>
): boolean {
    return Object.keys(value).every(key => allowed.has(key));
}

// Check for nonempty, unique string IDs
function isIdArray(value: unknown): value is string[] {
    return Array.isArray(value)
        && value.every(
            item => typeof item === 'string'
                && item.trim().length > 0
        )
        && new Set(value).size === value.length;
}

// Require the ISO format produced by toISOString()
function isIsoTimestamp(value: unknown): value is string {
    if (
        typeof value !== 'string'
        || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    ) {
        return false;
    }

    const timestamp = Date.parse(value);

    return !Number.isNaN(timestamp)
        && new Date(timestamp).toISOString() === value;
}

// Validate individual minigame progress
function isMiniGameProgress(
    value: unknown
): value is MiniGameProgress {
    if (!isRecord(value)) {
        return false;
    }

    return hasOnlyKeys(value, MINIGAME_FIELDS)
        && typeof value.completed === 'boolean'
        && typeof value.attempts === 'number'
        && Number.isInteger(value.attempts)
        && value.attempts >= 0
        && (
            value.bestScore === undefined
            || value.bestScore === null
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

    if (
        !hasOnlyKeys(value, SAVE_FIELDS)
        || value.schemaVersion !== SAVE_VERSION
    ) {
        return false;
    }

    if (
        typeof value.currentLevelId !== 'string'
        || value.currentLevelId.trim().length === 0
        || !isIdArray(value.unlockedLevelIds)
        || !isIdArray(value.completedLevelIds)
        || !isIdArray(value.claimedRewardIds)
        || !isRecord(value.miniGames)
        || !isIsoTimestamp(value.savedAt)
    ) {
        return false;
    }

    // Store the validated arrays in local variables
    const unlockedLevelIds = value.unlockedLevelIds;
    const completedLevelIds = value.completedLevelIds;

    // The current level must already be unlocked
    if (!unlockedLevelIds.includes(value.currentLevelId)) {
        return false;
    }

    // Completed levels must also be unlocked
    if (
        !completedLevelIds.every(
            id => unlockedLevelIds.includes(id)
        )
    ) {
        return false;
    }

    // Validate each minigame and reject unexpected fields
    return Object.entries(value.miniGames).every(
        ([id, progress]) =>
            id.trim().length > 0
            && isMiniGameProgress(progress)
    );
}

// Convert a valid save state into JSON
export function serializeSaveState(save: SaveState): string {
    if (!isSaveState(save)) {
        throw new Error('Invalid save state');
    }

    return JSON.stringify(save);
}

/**
 * Restore saved JSON or return default progress.
 *
 * Invalid data and unsupported schema versions both fall back
 * to a fresh save. The caller is not notified of the reset.
 *
 * No automatic migration is supported. Changing SAVE_VERSION
 * makes older saves incompatible and effectively resets progress
 * when the fallback state is subsequently saved.
 *
 * This function does not overwrite the original stored data.
 * A future version could return a fallback reason or migrate
 * older schemas to preserve player progress.
 */
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
