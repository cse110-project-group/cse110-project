// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../helpers/canvasStub.ts";
import Konva from "konva";
import { loadImage } from "../../src/systems/loadImage.ts";
import { init, fitStageToWindow, preloadMainMenuAssets, resetMainMenuAssets, } from "../../src/scenes/mainMenu.ts";

// Replace the real image loader so no files are needed. A canvas element
// stands in for an image.
vi.mock("../../src/systems/loadImage.ts", () => ({
  loadImage: vi.fn(() => Promise.resolve(document.createElement("canvas"))),
}));

// Sets the fake browser window size for a test.
function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: height, configurable: true });
}

// Finds the button group that contains the given label text.
function findButton(layer: Konva.Layer, label: string): Konva.Group {
  const group = layer
    .find<Konva.Group>("Group")
    .find((g) => g.findOne<Konva.Text>("Text")?.text() === label);
  if (!group) throw new Error(`No button labeled "${label}"`);
  return group;
}

beforeEach(() => {
  vi.mocked(loadImage).mockClear();

  document.body.innerHTML = '<div id="container"></div>';
  setWindowSize(1280, 720);
  resetMainMenuAssets();
});

afterEach(() => {
  Konva.stages.forEach((s) => s.destroy());
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("fitStageToWindow", () => {
  it("uses scale 1 when the window matches 1280x720", () => {
    const stage = new Konva.Stage({ container: "container", width: 1280, height: 720 });
    fitStageToWindow(stage);
    expect(stage.scaleX()).toBe(1);
    expect(stage.width()).toBe(1280);
  });

  it("scales by width when the window is narrow", () => {
    setWindowSize(640, 720);
    const stage = new Konva.Stage({ container: "container", width: 1280, height: 720 });
    fitStageToWindow(stage);
    expect(stage.scaleX()).toBe(0.5);
    expect(stage.width()).toBe(640);
    expect(stage.height()).toBe(360);
  });

  it("scales by height when the window is short", () => {
    setWindowSize(1920, 360);
    const stage = new Konva.Stage({ container: "container", width: 1280, height: 720 });
    fitStageToWindow(stage);
    expect(stage.scaleX()).toBe(0.5);
    expect(stage.height()).toBe(360);
  });
});

describe("init", () => {
  it("builds a menu layer with three buttons", async () => {
    const menu = await init(vi.fn(), vi.fn());
    const [menuLayer] = menu!.stage.getLayers();

    expect(menuLayer.find("Group")).toHaveLength(3);
  });

  it("calls onStart when Start Game is clicked", async () => {
    const onStart = vi.fn();
    const onLevels = vi.fn();
    const menu = await init(onStart, onLevels);
    const [menuLayer] = menu!.stage.getLayers();

    findButton(menuLayer, "Start Game").fire("click");

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("creates no stage and logs an error if an image fails to load", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(loadImage).mockRejectedValueOnce(new Error("Failed to load"));

    const menu = await init(vi.fn(), vi.fn());

    expect(menu).toBeUndefined();
    expect(Konva.stages).toHaveLength(0); // no blank canvas left behind
    expect(errorSpy).toHaveBeenCalled();
  });

  it('calls onLevels when Levels is clicked', async () => {
    const onStart = vi.fn();
    const onLevels = vi.fn();

    const menu = await init(onStart, onLevels);

    expect(menu).toBeDefined();

    const layer = menu!.stage.getLayers()[0];
    const levelsButton = findButton(layer, 'Levels');

    levelsButton.fire('click');

    expect(onLevels).toHaveBeenCalledTimes(1);

    menu!.destroy();
  });

  it("destroy removes the stage and resize listener and resets the cursor", async () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const menu = await init(vi.fn(), vi.fn());
    document.body.style.cursor = "pointer";

    menu!.destroy();

    expect(Konva.stages).toHaveLength(0);
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(document.body.style.cursor).toBe("default");
  });


  it("reuses cached images when reopening the main menu", async () => {
    const firstMenu = await init(vi.fn(), vi.fn());

    expect(firstMenu).toBeDefined();
    expect(loadImage).toHaveBeenCalledTimes(2);

    firstMenu!.destroy();

    const secondMenu = await init(vi.fn(), vi.fn());

    expect(secondMenu).toBeDefined();

    // Reopening should not load the same images again.
    expect(loadImage).toHaveBeenCalledTimes(2);

    secondMenu!.destroy();
  });

  it("allows the main menu to load after an image failure", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(loadImage).mockRejectedValueOnce(
      new Error("Image failed to load")
    );

    const failedMenu = await init(vi.fn(), vi.fn());

    expect(failedMenu).toBeUndefined();
    expect(Konva.stages).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalled();

    // The failed image should be retried successfully.
    const recoveredMenu = await init(vi.fn(), vi.fn());

    expect(recoveredMenu).toBeDefined();
    expect(recoveredMenu!.stage.getLayers()).toHaveLength(1);

    // Two initial loads, then only the failed image is retried.
    expect(loadImage).toHaveBeenCalledTimes(3);

    recoveredMenu!.destroy();
  });

  it("preloads menu images without creating a stage", async () => {
    const loaded = await preloadMainMenuAssets();

    expect(loaded).toBe(true);
    expect(loadImage).toHaveBeenCalledTimes(2);

    // Image preloading should not create a Konva stage.
    expect(Konva.stages).toHaveLength(0);

    const menu = await init(vi.fn(), vi.fn());

    expect(menu).toBeDefined();

    // init() should reuse the preloaded images.
    expect(loadImage).toHaveBeenCalledTimes(2);

    menu!.destroy();
  });
});
