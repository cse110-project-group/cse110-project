import Game from './game.ts'
import { init, preloadMainMenuAssets } from './scenes/mainMenu.ts'
import type { MainMenu } from './scenes/mainMenu.ts'
import { initLevelSelect, preloadLevelAssets } from './scenes/levelScene.ts'
import type { LevelSelect } from './scenes/levelScene.ts'
import {
  initCompletionScene,
  preloadCompletionAssets,
  type CompletionScene,
} from "./scenes/completeScene.ts";

async function main() {
	let menu: MainMenu | undefined;

	let levelScreen: LevelSelect | undefined;

    let completionScreen: CompletionScene | undefined;

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

        completionScreen?.destroy();
        completionScreen = undefined;
        const newMenu = await init(
            () => {
                // Start the actual game.
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
        () => {
            // Open the Level Selection screen.
            void showLevelScreen();
        }

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

        completionScreen?.destroy();
        completionScreen = undefined;

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

async function showCompletionScreen() {
  if (transitioning) return;
  transitioning = true;

  try {
    // Load the image before removing the Main Menu.
    const loaded = await preloadCompletionAssets();
    if (!loaded) return;

    // Destroy the Main Menu.
    menu?.destroy();
    menu = undefined;

    // Create the Completion Screen.
    const newScreen = await initCompletionScene(
      () => void showMainMenu(),
      () => void showLevelScreen()
    );

    if (!newScreen) {
      console.error("Failed to initialize Completion Screen.");
      return;
    }

    completionScreen = newScreen;
  } catch (err) {
    console.error("Failed to open Completion Screen:", err);
  } finally {
    transitioning = false;
  }
}

// TEMPORARY: Press C on the Main Menu to preview completion.
window.addEventListener("keydown", (event) => {
  if (
    event.key.toLowerCase() === "c" &&
    menu &&
    !transitioning
  ) {
    void showCompletionScreen();
  }
});

await showMainMenu();
}

main();