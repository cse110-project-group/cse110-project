// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach,} from "vitest";
import Konva from "konva";
import "../helpers/canvasStub";
import { initCompletionScene, preloadCompletionAssets, type CompletionScene, } from "../../src/scenes/completeScene";
import { TOTAL_LEVELS } from "../../src/scenes/levelScene";
import { loadImage } from "../../src/systems/loadImage";
import { resetImageCache } from "../../src/systems/imageCache";

// Mock image loading so no real PNG files are required.
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

// Find a button by its text label.
function findButton(
  layer: Konva.Layer,
  label: string
): Konva.Group {
  const button = layer
    .find<Konva.Group>("Group")
    .find((group) =>
      group
        .find<Konva.Text>("Text")
        .some((node) => node.text() === label)
    );

  if (!button) {
    throw new Error(`Button "${label}" not found`);
  }

  return button;
}

describe("Completion Screen", () => {
  const screens: CompletionScene[] = [];

  let stagesBeforeTest: Set<Konva.Stage>;

  // Create a screen and track it for cleanup.
  async function createTestScreen(
    onMainMenu = vi.fn(),
    onLevels = vi.fn()
  ): Promise<CompletionScene> {
    const screen = await initCompletionScene(
      onMainMenu,
      onLevels
    );

    if (!screen) {
      throw new Error("Completion Screen failed to initialize");
    }

    // Register cleanup before returning to the test.
    screens.push(screen);

    return screen;
  }

  beforeEach(() => {
    // Reset the cache and mocked image loading.
    resetImageCache();
    vi.mocked(loadImage).mockReset();

    stagesBeforeTest = new Set(Konva.stages);

    vi.mocked(loadImage).mockResolvedValue(
      document.createElement("canvas") as unknown as HTMLImageElement
    );

    // Create a fresh Konva container.
    document.body.innerHTML = '<div id="container"></div>';
    document.body.style.cursor = "default";

    setWindowSize(1280, 720);
  });

  afterEach(() => {
    // Destroy all successfully tracked Completion Screens.
    for (const screen of screens.splice(0)) {
      screen.destroy();
    }

    // Also clean up Stages that were created but never tracked,
    // such as when a test fails before saving its screen.
    for (const stage of [...Konva.stages]) {
      if (!stagesBeforeTest.has(stage)) {
        stage.destroy();
      }
    }

    // Restore the DOM and cursor.
    document.body.innerHTML = "";
    document.body.style.cursor = "default";

    // Restore spies and mocked implementations.
    vi.restoreAllMocks();
  });

  // TEST 1: The Completion Screen initializes.
  it("creates the Completion Screen", async () => {
    const screen = await createTestScreen();

    expect(screen.stage).toBeInstanceOf(Konva.Stage);
    expect(screen.stage.getLayers()).toHaveLength(1);
  });

  // TEST 2: The background is created.
  it("creates the completion background", async () => {
    const screen = await createTestScreen();
    const layer = screen.stage.getLayers()[0];

    const background = layer.findOne<Konva.Rect>("Rect");

    expect(background).not.toBeNull();
    expect(background!.fill()).toBe("#111536");
  });

  // TEST 3: The congratulations title is displayed.
  it("displays the congratulations title", async () => {
    const screen = await createTestScreen();
    const layer = screen.stage.getLayers()[0];

    const texts = layer
      .find<Konva.Text>("Text")
      .map((node) => node.text());

    expect(texts).toContain("CONGRATULATIONS!");
  });

  // TEST 4: The correct total level count is displayed.
  it("displays the total number of completed levels", async () => {
    const screen = await createTestScreen();
    const layer = screen.stage.getLayers()[0];

    const texts = layer
      .find<Konva.Text>("Text")
      .map((node) => node.text());

    expect(texts).toContain(
      `You completed all ${TOTAL_LEVELS} levels!`
    );

    expect(texts).toContain(
      `${TOTAL_LEVELS} / ${TOTAL_LEVELS} LEVELS COMPLETED`
    );
  });

  // TEST 5: Both navigation buttons exist.
  it("creates Main Menu and View Levels buttons", async () => {
    const screen = await createTestScreen();
    const layer = screen.stage.getLayers()[0];

    expect(findButton(layer, "Main Menu")).toBeDefined();
    expect(findButton(layer, "View Levels")).toBeDefined();
  });

  // TEST 6: Main Menu button calls its callback.
  it("calls onMainMenu when Main Menu is clicked", async () => {
    const onMainMenu = vi.fn();
    const onLevels = vi.fn();

    const screen = await createTestScreen(
      onMainMenu,
      onLevels
    );

    const layer = screen.stage.getLayers()[0];

    findButton(layer, "Main Menu").fire("click");

    expect(onMainMenu).toHaveBeenCalledTimes(1);
    expect(onLevels).not.toHaveBeenCalled();
  });

  // TEST 7: View Levels button calls its callback.
  it("calls onLevels when View Levels is clicked", async () => {
    const onMainMenu = vi.fn();
    const onLevels = vi.fn();

    const screen = await createTestScreen(
      onMainMenu,
      onLevels
    );

    const layer = screen.stage.getLayers()[0];

    findButton(layer, "View Levels").fire("click");

    expect(onLevels).toHaveBeenCalledTimes(1);
    expect(onMainMenu).not.toHaveBeenCalled();
  });

  // TEST 8: Stage scales correctly on resize.
  it("scales the Stage when the window is resized", async () => {
    const screen = await createTestScreen();

    setWindowSize(640, 360);
    window.dispatchEvent(new Event("resize"));

    expect(screen.stage.width()).toBe(640);
    expect(screen.stage.height()).toBe(360);
    expect(screen.stage.scaleX()).toBe(0.5);
    expect(screen.stage.scaleY()).toBe(0.5);
  });

  // TEST 9: Failed image loading prevents scene creation.
  it("handles image loading failure", async () => {
    vi.mocked(loadImage).mockRejectedValueOnce(
      new Error("Failed to load image")
    );

    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const stagesBefore = Konva.stages.length;

    const screen = await initCompletionScene(
      vi.fn(),
      vi.fn()
    );

    expect(screen).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    expect(Konva.stages.length).toBe(stagesBefore);
  });

  // TEST 10: Destroy cleans up the scene.
  it("destroys the Stage when leaving", async () => {
    const screen = await createTestScreen();
    const stage = screen.stage;

    const destroySpy = vi.spyOn(stage, "destroy");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    screen.destroy();

    // Remove the already-destroyed screen from cleanup tracking.
    screens.splice(screens.indexOf(screen), 1);

    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(Konva.stages).not.toContain(stage);
    expect(removeSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
  });

  // TEST 11: Preloading loads the asset without a Stage.
  it("preloads assets without creating a Stage", async () => {
    const stagesBefore = Konva.stages.length;

    const loaded = await preloadCompletionAssets();

    expect(loaded).toBe(true);
    expect(loadImage).toHaveBeenCalledTimes(1);
    expect(Konva.stages.length).toBe(stagesBefore);
  });

  // TEST 12: Failed preloading returns false.
  it("returns false when preloading fails", async () => {
    vi.mocked(loadImage).mockRejectedValueOnce(
      new Error("Failed to load image")
    );

    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const loaded = await preloadCompletionAssets();

    expect(loaded).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  // TEST 13: Preloaded image is reused.
  it("reuses preloaded assets when initializing", async () => {
    const loaded = await preloadCompletionAssets();

    expect(loaded).toBe(true);

    await createTestScreen();

    // button.png should only be loaded once.
    expect(loadImage).toHaveBeenCalledTimes(1);
  });
});
