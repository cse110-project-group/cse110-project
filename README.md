# cse110-project

A browser game built with [Konva](https://konvajs.org/), TypeScript, and [Vite](https://vite.dev/).

## Getting started

Requires Node.js 22.22.2+ (CI uses Node 24).

```sh
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
```

## Controls

| Key | Action |
| --- | --- |
| `A` / `←` | Move left |
| `D` / `→` | Move right |

## Project structure

```
src/
  main.ts                 entry point: creates and starts the Game
  game.ts                 Konva stage + layer, owns entities, runs the game loop
  entities/
    player/
      player.ts           player entity: ties the model and controller together
      playerModel.ts      the player's Konva shape (what is drawn)
      playerController.ts moves the model from keyboard input each frame
  systems/
    input.ts              tracks which keys are held down
tests/                    mirrors src/ (e.g. tests/systems/input.test.ts)
  helpers/
    canvasStub.ts         stubs canvas for Konva in jsdom tests
```

Entities follow a model/controller split: the **model** holds the Konva shape and state, the **controller** holds behavior, and the entity class wires them together and exposes `update(deltaTime)`.

### Game loop

`Game.start()` runs a `requestAnimationFrame` loop. Each frame it computes `deltaTime`, the **seconds** since the previous frame (capped at 0.1s so returning to a backgrounded tab doesn't make things jump), and passes it to each entity's `update`. Scale movement by `deltaTime` (e.g. `speed * deltaTime` with `speed` in pixels per second) so the game runs at the same speed on 60 Hz and 144 Hz displays. Konva redraws the layer automatically when shapes change.

## Testing

Tests use [Vitest](https://vitest.dev/) with a [jsdom](https://github.com/jsdom/jsdom) browser environment. Tests live in `tests/`, which mirrors the layout of `src/`. Name them after the file they test with a `.test.ts` suffix (e.g. `src/systems/input.ts` is tested by `tests/systems/input.test.ts`). Shared test utilities go in `tests/helpers/`.

```sh
npm test            # run all tests once
npm run test:watch  # rerun tests on file changes
```

Tests that touch browser APIs like `window` should start with:

```ts
// @vitest-environment jsdom
```

jsdom has no canvas, so tests that create Konva shapes or stages must also import the canvas stub before anything that uses Konva:

```ts
import '../helpers/canvasStub.ts'; // path relative to the test file
```

### Continuous integration

GitHub Actions (`.github/workflows/test.yml`) runs `npm test` on every push to any branch except `main`. Make sure tests pass before opening a pull request.
