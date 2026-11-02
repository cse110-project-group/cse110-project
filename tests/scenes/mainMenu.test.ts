// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../helpers/canvasStub.ts";
import Konva from "konva";
import { init, fitStageToWindow } from "../../src/scenes/mainMenu.ts";
import { loadImage } from "../../src/systems/loadImage.ts";

// Replaces the real loadImage() with a fake function so no actual PNG files
// are needed during testing. The fake returns a resolved Promise containing
// a canvas element, which Konva can use as an image source.
vi.mock("../../src/systems/loadImage.ts", () => ({
  loadImage: vi.fn(() => Promise.resolve(document.createElement("canvas"))),
}));

// Simulates different browser window sizes for testing responsive scaling.
// Object.defineProperty() overrides the window's width and height.
// configurable: true allows these properties to be changed in later tests.
function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: height, configurable: true });
}

// Finds a button group containing the specified text label.
// First finds all Konva Groups, then searches for the group whose
// Text node matches the label. Throws an error if no match is found.
function findButton(layer: Konva.Layer, label: string): Konva.Group {
  const group = layer
    .find<Konva.Group>("Group")
    .find((g) => g.findOne<Konva.Text>("Text")?.text() === label);
  if (!group) throw new Error(`No button labeled "${label}"`);
  return group;
}

// Runs before each test to create the HTML container required by Konva
// and reset the simulated browser window to 1280x720.
beforeEach(() => {
  document.body.innerHTML = '<div id="container"></div>';
  setWindowSize(1280, 720);
});

// Runs after each test to destroy remaining Konva stages, restore
// any mocked functions or spies, and clear the HTML document.
afterEach(() => {
  Konva.stages.forEach((s) => s.destroy());
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

// Tests whether fitStageToWindow() correctly scales the Stage
// to fit different browser dimensions while preserving its aspect ratio.
describe("fitStageToWindow", () => {

  // When the browser matches the virtual resolution of 1280x720,
  // the scale should remain 1 and the Stage width should stay 1280.
  it("uses scale 1 when the window matches 1280x720", () => {
    const stage = new Konva.Stage({ container: "container", width: 1280, height: 720 });
    fitStageToWindow(stage);
    expect(stage.scaleX()).toBe(1);
    expect(stage.width()).toBe(1280);
  });

  // When the browser is narrower, scaling is limited by its width.
  // 640 / 1280 = 0.5, so the Stage becomes 640x360.
  it("scales by width when the window is narrow", () => {
    setWindowSize(640, 720);
    const stage = new Konva.Stage({ container: "container", width: 1280, height: 720 });
    fitStageToWindow(stage);
    expect(stage.scaleX()).toBe(0.5);
    expect(stage.width()).toBe(640);
    expect(stage.height()).toBe(360);
  });

  // When the browser is shorter, scaling is limited by its height.
  // 360 / 720 = 0.5, so the Stage scales down by half.
  it("scales by height when the window is short", () => {
    setWindowSize(1920, 360);
    const stage = new Konva.Stage({ container: "container", width: 1280, height: 720 });
    fitStageToWindow(stage);
    expect(stage.scaleX()).toBe(0.5);
    expect(stage.height()).toBe(360);
  });
});

// Tests the main menu initialization, button functionality,
// image-loading error handling, and cleanup.
describe("init", () => {

  // Checks that init() creates a menu layer with exactly three
  // button groups: Start Game, Levels, and Options.
  // vi.fn() provides a fake onStart callback.
  it("builds a menu layer with three buttons", async () => {
    const menu = await init(vi.fn());
    const [menuLayer] = menu!.stage.getLayers();

    expect(menuLayer.find("Group")).toHaveLength(3);
  });

  // Simulates clicking the Start Game button and verifies that
  // the provided onStart callback executes exactly once.
  // vi.fn() tracks the number of times the callback is called.
  it("calls onStart when Start Game is clicked", async () => {
    const onStart = vi.fn();
    const menu = await init(onStart);
    const [menuLayer] = menu!.stage.getLayers();

    findButton(menuLayer, "Start Game").fire("click");

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  // Simulates an image-loading failure to verify that init()
  // handles the error without creating an empty Konva Stage.
  it("creates no stage and logs an error if an image fails to load", async () => {

    // Tracks console.error() calls while preventing expected error messages
    // from being printed to the test output.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Makes the next mocked loadImage() call reject with an error.
    vi.mocked(loadImage).mockRejectedValueOnce(new Error("Failed to load"));

    const menu = await init(vi.fn());

    // Verify that initialization failed, no Stage exists,
    // and the error was logged.
    expect(menu).toBeUndefined();
    expect(Konva.stages).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalled();
  });

  // Verifies that destroy() cleans up the menu by removing
  // its Stage, unregistering the resize listener, and resetting the cursor.
  it("destroy removes the stage and resize listener and resets the cursor", async () => {

    // Tracks whether removeEventListener() gets called.
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const menu = await init(vi.fn());

    // Simulates the cursor being a pointer after hovering over a button.
    document.body.style.cursor = "pointer";

    menu!.destroy();

    // Verify that the Stage was removed, a resize listener was
    // unregistered, and the cursor returned to its default state.
    expect(Konva.stages).toHaveLength(0);
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(document.body.style.cursor).toBe("default");
  });
});
