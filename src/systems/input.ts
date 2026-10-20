export default class Input {
	private keysDown = new Set<string>();
	
	constructor() {
		window.addEventListener('keydown', this.onKeyDown);
		window.addEventListener('keyup', this.onKeyUp);
		window.addEventListener('blur', this.onBlur);
	}

	private onKeyDown = (e: KeyboardEvent) => {
		this.keysDown.add(e.code);
	}

	private onKeyUp = (e: KeyboardEvent) => {
		this.keysDown.delete(e.code);

	}

	private onBlur = (e) => {
		this.keysDown.clear();
	}
	
	public isKeyDown(k: string): boolean {
		return this.keysDown.has(k);
	}

	public destroy(): void {
		window.removeEventListener('keydown', this.onKeyDown);
		window.removeEventListener('keyup', this.onKeyUp);
		window.removeEventListener('blur', this.onBlur);
	}
}
