import Game from './game.ts'
import { init, preloadMainMenuAssets } from './scenes/mainMenu.ts'
import type { MainMenu } from './scenes/mainMenu.ts'
import { initLevelSelect, preloadLevelAssets } from './scenes/levelScene.ts'
import type { LevelSelect } from './scenes/levelScene.ts'
import { initCompletionScene } from "./scenes/completeScene.ts";
import type { CompletionScene } from "./scenes/completeScene.ts";

async function main() {
	let menu: MainMenu | undefined;

	let levelScreen: LevelSelect | undefined;

    let transitioning = false;

async function showMainMenu() {
    if (transitioning) return;
    transitioning = true;

    try {
        // Load assets before destroying the level screen.
        const loaded = await preloadMainMenuAssets();
        if (!loaded) return;

        levelScreen?.destroy();
        levelScreen = undefined;

        const newMenu = await init(
            
() => {
    // TEMPORARY: Preview the completion screen.
    if (transitioning) return;
    transitioning = true;

    // Keep the main menu visible while assets load.
    void (async () => {
        try {
            const completion = await initCompletionScene(
                () => {
                    // Main Menu button.
                    completion?.destroy();
                    void showMainMenu();
                },
                () => {
                    // View Levels button.
                    completion?.destroy();
                    void showLevelScreen();
                }
            );

            if (!completion) return;

            menu?.destroy();
            menu = undefined;
        } catch (err) {
            console.error("Failed to preview completion screen:", err);
        } finally {
            transitioning = false;
        }
    })();
},

            () => {
                // Open the Level Selection screen.
                void showLevelScreen();
            }
        );

        if (!newMenu) {
            console.error("Main menu failed to initialize.");
            return;
        }

        menu = newMenu;
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
        // Load assets before destroying the main menu.
        const loaded = await preloadLevelAssets();
        if (!loaded) return;

        menu?.destroy();
        menu = undefined;

        const newLevelScreen = await initLevelSelect(() => {
            // Return to the Main Menu when Back is clicked.
            void showMainMenu();
        });

        if (!newLevelScreen) {
            console.error("Level screen failed to initialize.");
            return;
        }

        levelScreen = newLevelScreen;
    } 
    catch (err) {
        console.error("Failed to open level screen:", err);
    } 
    finally {
        transitioning = false;
    }
}


    await showMainMenu();
}

main();