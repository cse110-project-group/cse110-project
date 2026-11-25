// @vitest-environment jsdom
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import Konva from "konva";
import "../helpers/canvasStub";
import {
  initMiniGameScene,
  preloadMiniGameAssets,
  resetMiniGameAssets,
  type MiniGameScene,
} from "../../src/scenes/miniGameScene";
import { loadImage } from "../../src/systems/loadImage";

// Mock actual image loading.
vi.mock("../../src/systems/loadImage", () => ({
  loadImage: vi.fn(),
}));

// Simulate different browser window sizes.
function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
  });
}

// Find a button by the text inside its Konva Group.
function findButton(
  layer: Konva.Layer,
  label: string
): Konva.Group {
  const groups = layer.find<Konva.Group>("Group");

  const button = groups.find((group) =>
    group.find<Konva.Text>("Text").some(
      (text) => text.text() === label
    )
  );

  if (!button) {
    throw new Error(`Button "${label}" not found`);
  }

  return button;
}

describe("Mini Games Selection Screen", () => {
  // Track created screens so destroy() removes resize listeners.
  const screens: MiniGameScene[] = [];

  async function createTestScreen(
    onBack = vi.fn(),
    onSelectMiniGame = vi.fn()
  ): Promise<MiniGameScene> {
    const screen = await initMiniGameScene(
      onBack,
      onSelectMiniGame
    );

    expect(screen).toBeDefined();

    if (!screen) {
      throw new Error("Mini Games screen failed to initialize");
    }

    screens.push(screen);
    return screen;
  }

  beforeEach(() => {
    resetMiniGameAssets();

    document.body.innerHTML = '<div id="container"></div>';
    document.body.style.cursor = "default";

    setWindowSize(1280, 720);

    vi.mocked(loadImage).mockReset();
    vi.mocked(loadImage).mockResolvedValue(
      document.createElement("canvas") as unknown as HTMLImageElement
    );
  });

  afterEach(() => {
    // Use the scene's cleanup function.
    screens.splice(0).forEach((screen) => screen.destroy());

    // Remove any remaining Konva stages.
    [...Konva.stages].forEach((stage) => stage.destroy());

    document.body.style.cursor = "default";
    document.body.innerHTML = "";

    vi.restoreAllMocks();
  });

  // TEST 1: Successfully creates a scene.
  it("creates the Mini Games screen", async () => {
    const screen = await createTestScreen();

    expect(screen.stage).toBeInstanceOf(Konva.Stage);
    expect(screen.stage.getLayers()).toHaveLength(1);
  });

  // TEST 2: Creates background and title.
  it("creates a background and title", async () => {
    const screen = await createTestScreen();
    const layer = screen.stage.getLayers()[0];

    const images = layer.find<Konva.Image>("Image");
    expect(images.length).toBeGreaterThan(0);

    const title = layer.find<Konva.Text>("Text").find(
      (node) => node.text() === "MINI GAMES"
    );

    expect(title).toBeDefined();
  });

  // TEST 3: Creates both Mini Game choices.
  it("creates both Mini Game buttons", async () => {
    const screen = await createTestScreen();
    const layer = screen.stage.getLayers()[0];

    expect(findButton(layer, "Mini Game 1")).toBeDefined();
    expect(findButton(layer, "Mini Game 2")).toBeDefined();
  });

  // TEST 4: Mini Game 1 invokes the correct callback.
  it("selects Mini Game 1 when clicked", async () => {
    const onSelectMiniGame = vi.fn();
    const screen = await createTestScreen(
      vi.fn(),
      onSelectMiniGame
    );

    const layer = screen.stage.getLayers()[0];
    findButton(layer, "Mini Game 1").fire("click");

    expect(onSelectMiniGame).toHaveBeenCalledTimes(1);
    expect(onSelectMiniGame).toHaveBeenCalledWith(1);
  });

  // TEST 5: Mini Game 2 invokes the correct callback.
  it("selects Mini Game 2 when clicked", async () => {
    const onSelectMiniGame = vi.fn();
    const screen = await createTestScreen(
      vi.fn(),
      onSelectMiniGame
    );

    const layer = screen.stage.getLayers()[0];
    findButton(layer, "Mini Game 2").fire("click");

    expect(onSelectMiniGame).toHaveBeenCalledTimes(1);
    expect(onSelectMiniGame).toHaveBeenCalledWith(2);
  });

  // TEST 6: Back invokes onBack.
  it("calls onBack when Back is clicked", async () => {
    const onBack = vi.fn();
    const onSelectMiniGame = vi.fn();

    const screen = await createTestScreen(
      onBack,
      onSelectMiniGame
    );

    const layer = screen.stage.getLayers()[0];
    findButton(layer, "Back").fire("click");

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onSelectMiniGame).not.toHaveBeenCalled();
  });

  // TEST 7: Stage scales when the window is resized.
  it("scales the Stage when the window is resized", async () => {
    const screen = await createTestScreen();

    setWindowSize(640, 360);
    window.dispatchEvent(new Event("resize"));

    expect(screen.stage.width()).toBe(640);
    expect(screen.stage.height()).toBe(360);
    expect(screen.stage.scaleX()).toBe(0.5);
    expect(screen.stage.scaleY()).toBe(0.5);
  });

  // TEST 8: Failed image loading prevents scene creation.
  it("handles an image loading failure", async () => {
    vi.mocked(loadImage).mockRejectedValueOnce(
      new Error("Failed to load image")
    );

    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const stagesBefore = Konva.stages.length;

    const screen = await initMiniGameScene(
      vi.fn(),
      vi.fn()
    );

    expect(screen).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    expect(Konva.stages.length).toBe(stagesBefore);
  });

  // TEST 9: Destroy removes the stage and resize listener.
  it("destroys the scene when leaving", async () => {
    const screen = await createTestScreen();
    const stage = screen.stage;

    const removeSpy = vi.spyOn(
      window,
      "removeEventListener"
    );

    const destroySpy = vi.spyOn(stage, "destroy");

    screen.destroy();

    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(Konva.stages).not.toContain(stage);
    expect(removeSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
  });

  // TEST 10: Preloading loads assets without creating a Stage.
  it("preloads assets without creating a Stage", async () => {
    const stagesBefore = Konva.stages.length;

    const loaded = await preloadMiniGameAssets();

    expect(loaded).toBe(true);
    expect(loadImage).toHaveBeenCalledTimes(2);
    expect(Konva.stages.length).toBe(stagesBefore);
  });

  // TEST 11: Preloaded images are reused during initialization.
  it("reuses preloaded images when creating the scene", async () => {
    const loaded = await preloadMiniGameAssets();

    expect(loaded).toBe(true);

    await createTestScreen();

    // Preloading should prevent two additional loads.
    expect(loadImage).toHaveBeenCalledTimes(2);
  });

  // TEST 12: Failed preloading returns false.
  it("returns false when preloading fails", async () => {
    vi.mocked(loadImage).mockRejectedValueOnce(
      new Error("Failed to load image")
    );

    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const stagesBefore = Konva.stages.length;

    const loaded = await preloadMiniGameAssets();

    expect(loaded).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    expect(Konva.stages.length).toBe(stagesBefore);
  });
});
