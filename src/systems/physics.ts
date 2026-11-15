/** Downward acceleration applied to falling entities, in pixels per second². */
export const GRAVITY = 2000;
/** Maximum downward speed, in pixels per second. */
export const TERMINAL_VELOCITY = 1200;

/**
 * Applies one frame of gravity to a vertical speed.
 *
 * @param ySpeed - Current vertical speed, in pixels per second (positive is
 *   down).
 * @param dt - Seconds elapsed since the last frame.
 * @returns The new vertical speed, capped at {@link TERMINAL_VELOCITY}, and
 *   the distance moved this frame, in pixels. The distance is approximate on
 *   a frame where the speed reaches the cap.
 */
export function applyGravity(ySpeed: number, dt: number):
	{ySpeed: number; dy: number} {
	const next = Math.min(ySpeed + GRAVITY * dt, TERMINAL_VELOCITY);
	return {ySpeed: next, dy: 0.5 * (next + ySpeed) * dt};
}
