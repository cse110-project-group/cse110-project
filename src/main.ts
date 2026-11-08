import Game from './game.ts'
import { init } from './scenes/mainMenu.ts'
import type { MainMenu } from './scenes/mainMenu.ts'
import { initLevelSelect } from './scenes/levelScene.ts'
import type { LevelSelect } from './scenes/levelScene.ts'

async function main() {
	let menu: MainMenu | undefined;

	let levelScreen: LevelSelect | undefined;

	async function showMainMenu() {
        menu = await init(
            () => {
                // EXISTING: Start Game behavior.
                menu?.destroy();

                const game = new Game();
                game.start();
            },
			() => {
                menu?.destroy();
                menu = undefined;

                // Open the Level Selection screen.
                void showLevelScreen();
            }
        );
    }

	async function showLevelScreen() {
        levelScreen = await initLevelSelect(() => {
            levelScreen?.destroy();
            levelScreen = undefined;

            // Return to the Main Menu when Back is clicked.
            void showMainMenu();
        });
    }
	await showMainMenu();
}

main();