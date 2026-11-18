
import type { SaveState } from './saveState';
import type { StorageAdapter } from './storageAdapter';
import {
    serializeSaveState,
    deserializeSaveState,
} from './saveSerializer';

const SAVE_KEY = 'player-save';

export class SaveManager {
    private constructor(
        private storage: StorageAdapter,
        private state: SaveState
    ) {}

    // Load existing progress or start a new game
    static async load(
        storage: StorageAdapter,
        startingLevelId: string
    ): Promise<SaveManager> {
        const json = await storage.read(SAVE_KEY);

        const state = deserializeSaveState(
            json,
            startingLevelId
        );

        return new SaveManager(storage, state);
    }

    // Get current player progress
    getState(): Readonly<SaveState> {
        return this.state;
    }

    // Save updated progress
    private async persist(next: SaveState): Promise<void> {
        next.savedAt = new Date().toISOString();

        await this.storage.write(
            SAVE_KEY,
            serializeSaveState(next)
        );

        this.state = next;
    }

    // Record a completed level and unlock the next one
    async completeLevel(
        levelId: string,
        nextLevelId?: string
    ): Promise<void> {
        const completedLevelIds = [
            ...new Set([
                ...this.state.completedLevelIds,
                levelId
            ])
        ];

        const unlockedLevelIds = nextLevelId
            ? [...new Set([
                ...this.state.unlockedLevelIds,
                nextLevelId
            ])]
            : [...this.state.unlockedLevelIds];

        await this.persist({
            ...this.state,
            completedLevelIds,
            unlockedLevelIds,
            currentLevelId:
                nextLevelId ?? this.state.currentLevelId
        });
    }

    // Record minigame completion
    async completeMinigame(
        gameId: string,
        attempts: number,
        score?: number
    ): Promise<void> {
        const previous = this.state.miniGames[gameId];

        const bestScore = score === undefined
            ? previous?.bestScore
            : Math.max(score, previous?.bestScore ?? score);

        const progress = {
            completed: true,
            attempts,
            ...(bestScore === undefined ? {} : { bestScore })
        };

        await this.persist({
            ...this.state,
            miniGames: {
                ...this.state.miniGames,
                [gameId]: progress
            }
        });
    }
}
