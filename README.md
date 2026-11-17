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

The game opens on a main menu. Click **Start Game** to enter the game (the **Levels** and **Options** buttons are placeholders for now; a level select screen exists in `scenes/levelScene.ts` but is not wired into the menu yet).

| Key | Action |
| --- | --- |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `Space` / `W` / `↑` | Jump (while standing on something) |

The player accelerates up to a top speed and decelerates when no direction (or both directions) is held. Gravity pulls the player down onto solid obstacles. Releasing jump early gives a shorter jump, and a jump still works briefly after walking off a ledge (coyote time) or when pressed just before landing (jump buffering).

## Project structure

```
index.html                page shell with the #container div Konva draws into
public/assets/            images (menu background, button sprite, Locked_Level.png, placeholders)
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
    levelScene.ts         level select screen: 4x3 grid of level buttons plus a back button
    gameScene.ts          (empty, reserved)
  UI/
    createButton.ts       reusable image button with hover/press animations
  levels/
    level.ts              Level interface: the structure of a level's data
    levelParser.ts        LevelParser: converts level JSON strings to Level objects and back
  save/
    saveState.ts          SaveState shape and createInitialSaveState()
    saveSerializer.ts     serializeSaveState() / deserializeSaveState(): JSON conversion, validation, schema version fallback
    saveManager.ts        SaveManager: loads, updates, and persists player progress
    storageAdapter.ts     StorageAdapter interface (read/write/remove by key)
    browserStorageAdapter.ts StorageAdapter backed by localStorage
  systems/
    input.ts              tracks which keys are held down
    collision.ts          AABB overlap checks and per-axis movement resolution
    loadImage.ts          Promise-based image loader
    trigGenerator.ts      trig question sources built on RandMatQuGeA
    physics.ts            gravity constants and applyGravity()
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

The main menu (`scenes/mainMenu.ts`) lays itself out in a fixed 1280×720 virtual resolution and scales the stage to fit the window while keeping the aspect ratio. `init(onStart)` loads its images with `loadImage`, builds the buttons with `createButton`, and returns a `MainMenu` whose `destroy()` removes the stage and its resize listener.

The level select scene (`scenes/levelScene.ts`) shows a 4×3 grid of level buttons (the grid size may change) and a button that returns to the main menu. Like the main menu, it loads its images with `loadImage`, builds its buttons with `createButton`, and exposes a `destroy()` that cleans the scene up when switching screens so nothing leaks. Locked levels use the `public/assets/Locked_Level.png` image.

`createButton` returns a Konva group that is not yet added to a layer, so any scene can reuse it. It accepts an optional y offset for the label (`offsetY`) to nudge the text and avoid overlapping any text baked into the button image.

### Levels

`levels/level.ts` defines the `Level` interface, which stores the structure of a level's data: its number (`num`), the player's `spawnPoint`, and its `platforms` and `slopes`. `levels/levelParser.ts` defines `LevelParser`, a class that converts JSON strings holding level data into `Level` objects (`unserialize`) and `Level` objects back into JSON strings (`serialize`).

```ts
const level1 = { num: 1, spawnPoint: { x: 1, y: 2 }, platforms: [], slopes: [] };

const parser = new LevelParser();
const level = parser.unserialize(data, level1); // data: JSON string for level 1
const string = parser.serialize(level);         // back to a JSON string
```

`unserialize` takes the JSON string for a level (`data`) along with a `Level` object (`level1` above) and returns the parsed `Level`.

### Trig questions

`systems/trigGenerator.ts` wraps [RandMatQuGeA](https://github.com/richie-rich90454/RandMatQuGeA) to generate questions for the minigames. Each source takes a difficulty of `'easy'`, `'medium'`, or `'hard'` (default `'easy'`) and returns prompts and answers as LaTeX:

- `LockGameQuestionSource`: an equation and its general solution, plus `lockNumbers`, a 4-position combination as clock positions 1–12.
- `MatchingGameQuestionSource`: a trig expression and its exact value, for a card-matching game. Different expressions can share a value, so skip duplicate answers when building a round.

### Saving

The save system is split into four layers, each with one job:

| Layer | File | Responsibility |
| --- | --- | --- |
| Data shape | `save/saveState.ts` | Defines `SaveState` (current, unlocked, and completed levels, minigame progress, claimed rewards, timestamps) and `createInitialSaveState(startingLevelId)`. |
| Serialization | `save/saveSerializer.ts` | Converts a `SaveState` to and from JSON strings and validates it. |
| Storage | `save/storageAdapter.ts`, `save/browserStorageAdapter.ts` | `StorageAdapter` reads, writes, and removes strings by key. `BrowserStorageAdapter` implements it with `localStorage`, prefixing keys with `cse110-game-saves:`. |
| Management | `save/saveManager.ts` | `SaveManager` ties the other layers together so the rest of the game never touches storage or serialization directly. |

#### Serialization

- `serializeSaveState()` converts valid save data into JSON.
- `deserializeSaveState()` restores saved progress from JSON. It validates level progress, minigame data, rewards, and timestamps, and checks that the schema version is the current one.
- If the stored data is missing, is corrupted JSON, has missing fields or wrong types, or uses an older or unsupported schema version, `deserializeSaveState()` returns a fresh default save instead of crashing. The fallback does not overwrite the original stored data.
- Serialization is kept separate from the storage adapter, so storage only deals in strings and doesn't depend on the shape of the game's progress. Validation lives in small helper functions.

#### SaveManager

`SaveManager` loads, updates, and saves player progress through a `StorageAdapter`, so the storage implementation can be swapped later.

- `load()`: restores an existing save (validated by the serializer), or initializes default progress if there is none or it is invalid.
- `completeLevel()`: marks a level completed and unlocks new levels. Levels are tracked with Sets, so completing the same level twice never creates duplicates.
- `completeMinigame()`: records a minigame's completion status, attempts, and best score.
- Every update made through the manager updates the save's timestamp and is persisted automatically.

Saves are not yet wired into gameplay. Next steps are to call the `SaveManager` methods from real level and minigame completion events, to use `load()` during game startup so returning players resume their progress, and to add schema migrations so progress survives future changes to the save format.

## Testing

Tests use [Vitest](https://vitest.dev/) with a [jsdom](https://github.com/jsdom/jsdom) browser environment. Tests live in `tests/`, which mirrors the layout of `src/`. Name them after the file they test with a `.test.ts` suffix (e.g. `src/systems/input.ts` is tested by `tests/systems/input.test.ts`). Shared test utilities go in `tests/helpers/`.

```sh
npm test            # run all tests once
npm run test:watch  # rerun tests on file changes
```

Run a single file or folder with `npx vitest run <path>`, for example:

```sh
npx vitest run tests/save                       # all save-system tests
npx vitest run tests/save/saveSerializer.test.ts
npx vitest run tests/save/saveManager.test.ts
npx vitest run tests/levels/levelParser.test.ts
npx vitest run tests/scenes/levelScene.test.ts
```

Check types with:

```sh
npx tsc --noEmit
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
