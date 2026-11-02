import Game from './game.ts'
import { init } from './scenes/mainMenu.ts'
import type { MainMenu } from './scenes/mainMenu.ts'

async function main() {
	let menu: MainMenu | undefined;

	menu = await init(() => {
		menu?.destroy();

		const game = new Game();
		game.start();
	});
}

main();