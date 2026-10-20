/**
 * Tracks which keyboard keys are currently held down.
 *
 * Listens for `keydown` / `keyup` events on the window and keeps a set of
 * pressed keys so game code can poll input state each frame (e.g. inside a
 * `requestAnimationFrame` loop) instead of reacting to individual events.
 *
 * Keys are identified by `KeyboardEvent.code` (e.g. `'KeyA'`, `'ArrowLeft'`,
 * `'Space'`), which refers to the physical key and is unaffected by keyboard
 * layout or modifier keys like Shift.
 *
 * @example
 * const input = new Input();
 * function gameLoop() {
 *   if (input.isKeyDown('KeyA')) player.moveLeft();
 *   requestAnimationFrame(gameLoop);
 * }
 */
export default class Input {
	/** `KeyboardEvent.code` values of all keys currently held down. */
	private keysDown = new Set<string>();

	/** Starts listening for keyboard and window focus events. */
	constructor() {
		window.addEventListener('keydown', this.onKeyDown);
		window.addEventListener('keyup', this.onKeyUp);
		window.addEventListener('blur', this.onBlur);
	}

	/** Marks a key as held down. */
	private onKeyDown = (e: KeyboardEvent) => {
		this.keysDown.add(e.code);
	}

	/** Marks a key as released. */
	private onKeyUp = (e: KeyboardEvent) => {
		this.keysDown.delete(e.code);
	}

	/**
	 * Releases all keys when the window loses focus. Without this, a key held
	 * while the user tabs away would never receive its `keyup` and would stay
	 * "stuck" down.
	 */
	private onBlur = () => {
		this.keysDown.clear();
	}

	/**
	 * Checks whether a key is currently held down.
	 *
	 * @param k - The key's `KeyboardEvent.code`, e.g. `'KeyA'` or `'ArrowUp'`.
	 * @returns `true` if the key is pressed, otherwise `false`.
	 */
	public isKeyDown(k: string): boolean {
		return this.keysDown.has(k);
	}

	/**
	 * Removes all event listeners. Call this when the instance is no longer
	 * needed (e.g. when switching scenes) to avoid leaking listeners.
	 */
	public destroy(): void {
		window.removeEventListener('keydown', this.onKeyDown);
		window.removeEventListener('keyup', this.onKeyUp);
		window.removeEventListener('blur', this.onBlur);
	}
}
