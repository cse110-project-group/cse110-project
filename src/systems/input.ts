/**
 * Tracks which keyboard keys are currently held down and where the pointer
 * (mouse, touch or pen) is pressed.
 *
 * Listens for keyboard and pointer events on the window and keeps the current
 * input state so game code can poll it each frame (e.g. inside a
 * `requestAnimationFrame` loop) instead of reacting to individual events.
 *
 * Keys are identified by `KeyboardEvent.code` (e.g. `'KeyA'`, `'ArrowLeft'`,
 * `'Space'`), which refers to the physical key and is unaffected by keyboard
 * layout or modifier keys like Shift.
 *
 * Pointer positions are reported relative to a target element (e.g. the Konva
 * stage's container), so this class needs no knowledge of Konva itself.
 *
 * @example
 * const input = new Input(stage.container());
 * function gameLoop() {
 *   if (input.isKeyDown('KeyA')) player.moveLeft();
 *   const click = input.getMouseDownLocation();
 *   if (click) console.log('pressed at', click);
 *   requestAnimationFrame(gameLoop);
 * }
 */
export default class Input {
	/** Keys whose default browser action (page scrolling) is suppressed. */
	private static readonly BLOCKED_KEYS = new Set([
		'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space',
	]);

	/** `KeyboardEvent.code` values of all keys currently held down. */
	private keysDown = new Set<string>();
	/** Whether the pointer is currently pressed. */
	private isPointerDown = false;
	/**
	 * Last known pointer position in client (viewport) coordinates. Only
	 * meaningful while {@link Input.isPointerDown} is `true`.
	 */
	private pointerPos: [x: number, y: number] = [0, 0];

	/**
	 * Starts listening for keyboard, pointer and window focus events.
	 *
	 * @param target - Element that pointer positions are reported relative to.
	 *   Defaults to `document.body`.
	 */
	constructor(private target: HTMLElement = document.body) {
		window.addEventListener('keydown', this.onKeyDown);
		window.addEventListener('keyup', this.onKeyUp);
		window.addEventListener('blur', this.onBlur);
		window.addEventListener('pointerdown', this.onPointerDown);
		window.addEventListener('pointermove', this.onPointerMove);
		window.addEventListener('pointerup', this.onPointerUp);
		window.addEventListener('pointercancel', this.onPointerUp);
	}

	/** Marks a key as held down. */
	private onKeyDown = (e: KeyboardEvent) => {
		if (Input.BLOCKED_KEYS.has(e.code)) e.preventDefault();
		this.keysDown.add(e.code);
	}

	/** Marks a key as released. */
	private onKeyUp = (e: KeyboardEvent) => {
		this.keysDown.delete(e.code);
	}

	/** Marks the pointer as pressed and records where. */
	private onPointerDown = (e: PointerEvent) => {
		this.isPointerDown = true;
		this.pointerPos = [e.clientX, e.clientY];
	}

	/** Records the pointer position so drags are tracked while pressed. */
	private onPointerMove = (e: PointerEvent) => {
		this.pointerPos = [e.clientX, e.clientY];
	}

	/** Marks the pointer as released. Also handles `pointercancel`. */
	private onPointerUp = () => {
		this.isPointerDown = false;
	}

	/**
	 * Releases all keys and the pointer when the window loses focus. Without
	 * this, a key or mouse button held while the user tabs away would never
	 * receive its release event and would stay "stuck" down.
	 */
	private onBlur = () => {
		this.keysDown.clear();
		this.isPointerDown = false;
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
	 * Gets where the pointer is currently pressed, relative to the target
	 * element's top-left corner. The element's position is measured at call
	 * time, so the result stays correct if the page scrolls or the layout
	 * shifts.
	 *
	 * @returns The `[x, y]` position in pixels, or `null` if the pointer is
	 *   not pressed.
	 */
	public getMouseDownLocation(): [x: number, y: number] | null {
		if (!this.isPointerDown) return null;
		const rect = this.target.getBoundingClientRect();
		return [this.pointerPos[0] - rect.left, this.pointerPos[1] - rect.top];
	}

	/**
	 * Removes all event listeners. Call this when the instance is no longer
	 * needed (e.g. when switching scenes) to avoid leaking listeners.
	 */
	public destroy(): void {
		window.removeEventListener('keydown', this.onKeyDown);
		window.removeEventListener('keyup', this.onKeyUp);
		window.removeEventListener('blur', this.onBlur);
		window.removeEventListener('pointerdown', this.onPointerDown);
		window.removeEventListener('pointermove', this.onPointerMove);
		window.removeEventListener('pointerup', this.onPointerUp);
		window.removeEventListener('pointercancel', this.onPointerUp);
	}
}
