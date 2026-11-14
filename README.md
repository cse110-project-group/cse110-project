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

The game opens on a main menu. Click **Start Game** to enter the game (the **Levels** and **Options** buttons are placeholders for now).

| Key | Action |
| --- | --- |
| `A` / `←` | Move left |
| `D` / `→` | Move right |

The player accelerates up to a top speed and decelerates when no direction (or both directions) is held.

## Project structure

```
index.html                page shell with the #container div Konva draws into
public/assets/            images (menu background, button sprite, placeholders)
src/
  main.ts                 entry point: shows the main menu, starts the Game on "Start Game"
  game.ts                 Konva stage + layer, owns entities, runs the game loop
  entities/
    player/
      player.ts           player entity: ties the model and controller together
      playerModel.ts      the player's Konva shape (what is drawn)
      playerController.ts moves the model from keyboard input each frame, with collisions
  scenes/
    mainMenu.ts           main menu: background, buttons, scales to fit the window
    levelScene.ts         level select screen (work in progress)
    gameScene.ts          (empty, reserved)
  UI/
    createButton.ts       reusable image button with hover/press animations
  save/
    saveState.ts          SaveState shape and createInitialSaveState()
    storageAdapter.ts     StorageAdapter interface (read/write/remove by key)
    browserStorageAdapter.ts StorageAdapter backed by localStorage
  systems/
    input.ts              tracks which keys are held down
    collision.ts          AABB overlap checks and horizontal movement resolution
    loadImage.ts          Promise-based image loader
    trigGenerator.ts      trig question sources built on RandMatQuGeA
    physics.ts            (empty, reserved)
tests/                    mirrors src/ (e.g. tests/systems/input.test.ts)
  helpers/
    canvasStub.ts         stubs canvas for Konva in jsdom tests
```

Entities follow a model/controller split: the **model** holds the Konva shape and state, the **controller** holds behavior, and the entity class wires them together and exposes `update(deltaTime)`.

### Game loop

`Game.start()` runs a `requestAnimationFrame` loop. Each frame it computes `deltaTime`, the **seconds** since the previous frame (capped at 0.1s so returning to a backgrounded tab doesn't make things jump), and passes it to each entity's `update`. Scale movement by `deltaTime` (e.g. `speed * deltaTime` with `speed` in pixels per second) so the game runs at the same speed on 60 Hz and 144 Hz displays. Konva redraws the layer automatically when shapes change.

### Collisions

Each frame the game passes the game layer's children to `player.update(deltaTime, obstacles)`. Any Konva node given the name `solid` (e.g. `new Konva.Rect({ ..., name: 'solid' })`) blocks the player's movement; other nodes are ignored. `systems/collision.ts` sweeps the player's bounding box along its movement on each axis (via `resolveMovement`) and clamps it against solid boxes, and the controller resets the player's speed when it hits one.

#### Intended Designs

- **Entities smaller than 1px do not collide.** Collision uses a 0.5px tolerance on each side to address floating-point error and to ignore surfaces an entity is only brushing against. Any entity under 1px in width or height ends up passing through obstacles. No current entity is this small, so this is accepted behavior.
- **Overlapping entities can only escape vertically.** If an entity is already overlapping a solid beyond the tolerance, horizontal movement and downward movement are blocked, and only upward movement (e.g. a jump) is allowed. This prevents falling or sliding through obstacles, but it stays still until it jumps out.

### Scenes and UI

The main menu (`scenes/mainMenu.ts`) lays itself out in a fixed 1280×720 virtual resolution and scales the stage to fit the window while keeping the aspect ratio. `init(onStart)` loads its images with `loadImage`, builds the buttons with `createButton`, and returns a `MainMenu` whose `destroy()` removes the stage and its resize listener. `createButton` returns a Konva group that is not yet added to a layer, so any scene can reuse it.

### Trig questions

`systems/trigGenerator.ts` wraps [RandMatQuGeA](https://github.com/richie-rich90454/RandMatQuGeA) to generate questions for the minigames. Each source takes a difficulty of `'easy'`, `'medium'`, or `'hard'` (default `'easy'`) and returns prompts and answers as LaTeX:

- `LockGameQuestionSource`: an equation and its general solution, plus `lockNumbers`, a 4-position combination as clock positions 1–12.
- `MatchingGameQuestionSource`: a trig expression and its exact value, for a card-matching game. Different expressions can share a value, so skip duplicate answers when building a round.

### Saving

`save/saveState.ts` defines the `SaveState` (current, unlocked, and completed levels, minigame progress, claimed rewards) and `createInitialSaveState(startingLevelId)`. Saves are stored through the `StorageAdapter` interface; `BrowserStorageAdapter` implements it with `localStorage`, prefixing keys with `cse110-game-saves:`. Saves are not yet wired into the game.

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
