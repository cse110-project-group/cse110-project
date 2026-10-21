/**
 * jsdom has no canvas implementation, so `getContext('2d')` returns `null` and
 * Konva throws as soon as a shape is created. Importing this file replaces
 * `getContext` with a stub whose every method is a no-op, which is enough to
 * create and move Konva nodes in tests. Nothing is actually rendered.
 *
 * @example
 * // @vitest-environment jsdom
 * import '../helpers/canvasStub.ts';
 */
const noop = () => ({ data: new Uint8ClampedArray(4), width: 0 });

const context = new Proxy({} as Record<string | symbol, unknown>, {
	get: (target, prop) => (prop in target ? target[prop] : noop),
	set: (target, prop, value) => {
		target[prop] = value;
		return true;
	},
});

HTMLCanvasElement.prototype.getContext = (() => context) as never;
