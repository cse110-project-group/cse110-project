import Game from './game.ts'
import { init, preloadMainMenuAssets } from './scenes/mainMenu.ts'
import { initLevelSelect, preloadLevelAssets } from './scenes/levelScene.ts'

async function main() {
	let currentScreen: { destroy: () => void } | undefined;

  let transitioning = false;

  async function switchTo(
    preload: () => Promise<boolean>,
    create: () => Promise<{ destroy: () => void } | undefined>
  ): Promise<boolean> {
    if (transitioning) return false;
    transitioning = true;

    try {
        // Load all assets before switching.
        const loaded = await preload();
        if (!loaded) return false;

        // Initialize the next screen before destroying the old one.
        const newScreen = await create();

        if (!newScreen) {
            console.error("Failed to initialize the next screen.");
            return false;
        }

        // Switch only after initialization succeeds.
        const previousScreen = currentScreen;
        currentScreen = newScreen;
        previousScreen?.destroy();

        return true;
    } catch (err) {
        console.error("Failed to switch screens:", err);
        return false;
    } finally {
        transitioning = false;
    }
}

async function showMainMenu() {
    await switchTo(
        preloadMainMenuAssets,
        () => init(
            () => {
                // Start the actual game.
                if (transitioning) return;

                transitioning = true;

                try {
                    const game = new Game();

                    currentScreen?.destroy();
                    currentScreen = undefined;

                    game.start();
                } catch (err) {
                    console.error("Failed to start game:", err);
                } finally {
                    transitioning = false;
                }
            },
            () => {
                // Open the Level Selection screen.
                void showLevelScreen();
            }
        )
    );
}

async function showLevelScreen() {
    await switchTo(
        preloadLevelAssets,
        () => initLevelSelect(() => {
            // Return to the Main Menu when Back is clicked.
            void showMainMenu();
        })
    );
}

await showMainMenu();
}

main();