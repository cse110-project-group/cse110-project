import Game from './game.ts'
import { init, preloadMainMenuAssets } from './scenes/mainMenu.ts'
import type { MainMenu } from './scenes/mainMenu.ts'
import { initLevelSelect, preloadLevelAssets } from './scenes/levelScene.ts'
import type { LevelSelect } from './scenes/levelScene.ts'

async function main() {
	let menu: MainMenu | undefined;

	let levelScreen: LevelSelect | undefined;

    let transitioning = false;

    async function showMainMenu() {
        if (transitioning) return;
        transitioning = true;

       try {
            // FIX: Load assets before destroying the level screen.
            const loaded = await preloadMainMenuAssets();
            if (!loaded) return;

            levelScreen?.destroy();
            levelScreen = undefined;

            menu = await init(
                () => {
                    // EXISTING: Start Game behavior.
                    if (transitioning) return;
                    transitioning = true;

                    menu?.destroy();
                    menu = undefined;

                    const game = new Game();
                    game.start();
                },
                () => {
                    // Open the Level Selection screen.
                    void showLevelScreen();
                }
            );
        } catch (err) {
            console.error("Failed to open main menu:", err);
        } finally {
            transitioning = false;
        }
    }

	async function showLevelScreen() {
        if (transitioning) return;
        transitioning = true;

        try {
            // FIX: Load assets before destroying the main menu.
            const loaded = await preloadLevelAssets();
            if (!loaded) return;

            menu?.destroy();
            menu = undefined;

            levelScreen = await initLevelSelect(() => {
                // Return to the Main Menu when Back is clicked.
                void showMainMenu();
            });
        } catch (err) {
            console.error("Failed to open level screen:", err);
        } finally {
            transitioning = false;
        }
    }

    await showMainMenu();
}

main();