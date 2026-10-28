// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../helpers/canvasStub.ts";
import Konva from "konva";
import { init, fitStageToWindow } from "../../src/scenes/mainMenu.ts";
import { loadImage } from "../../src/systems/loadImage.ts";

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
  // Fresh page with the container element that init() expects.
  document.body.innerHTML = '<div id="container"></div>';
  setWindowSize(1280, 720);
});

afterEach(() => {
  // Konva keeps every stage in a global list, so destroy them to stop
  // one test's stage from leaking into the next.
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
    expect(stage.height()).toBe(360); // keeps the 16:9 shape
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
  it("builds a menu layer with three buttons and a hidden game layer", async () => {
    const stage = await init();
    const [menuLayer, gameLayer] = stage!.getLayers();

    expect(menuLayer.visible()).toBe(true);
    expect(gameLayer.visible()).toBe(false);
    expect(menuLayer.find("Group")).toHaveLength(3);
  });

  it("switches to the game screen when Start Game is clicked", async () => {
    const stage = await init();
    const [menuLayer, gameLayer] = stage!.getLayers();

    findButton(menuLayer, "Start Game").fire("click");

    expect(menuLayer.visible()).toBe(false);
    expect(gameLayer.visible()).toBe(true);
  });

  it("returns to the menu when the game screen is clicked", async () => {
    const stage = await init();
    const [menuLayer, gameLayer] = stage!.getLayers();

    findButton(menuLayer, "Start Game").fire("click");
    gameLayer.fire("click");

    expect(menuLayer.visible()).toBe(true);
    expect(gameLayer.visible()).toBe(false);
  });

  it("logs an error and returns nothing if an image fails to load", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(loadImage).mockRejectedValueOnce(new Error("Failed to load"));

    const stage = await init();

    expect(stage).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });
});