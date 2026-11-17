// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "../helpers/canvasStub";
import Konva from "konva";
import {
  createScene,
  fitStageToWindow,
  WIDTH,
  HEIGHT,
} from "../../src/scenes/sceneUtils";

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

describe("sceneUtils", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "container";
    document.body.appendChild(container);

    setWindowSize(1280, 720);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it("creates a stage and layer", () => {
    const scene = createScene();

    expect(scene.stage).toBeInstanceOf(Konva.Stage);
    expect(scene.layer).toBeInstanceOf(Konva.Layer);
    expect(scene.stage.getLayers().length).toBe(1);
    expect(scene.stage.getLayers()[0]).toBe(scene.layer);

    scene.destroy();
  });

  it("scales the stage while preserving aspect ratio", () => {
    setWindowSize(640, 360);

    const scene = createScene();

    expect(scene.stage.width()).toBe(640);
    expect(scene.stage.height()).toBe(360);
    expect(scene.stage.scaleX()).toBe(0.5);
    expect(scene.stage.scaleY()).toBe(0.5);

    scene.destroy();
  });

  it("updates the stage when the window is resized", () => {
    const scene = createScene();

    setWindowSize(960, 540);
    window.dispatchEvent(new Event("resize"));

    const expectedScale = Math.min(
      960 / WIDTH,
      540 / HEIGHT
    );

    expect(scene.stage.scaleX()).toBe(expectedScale);
    expect(scene.stage.scaleY()).toBe(expectedScale);
    expect(scene.stage.width()).toBe(WIDTH * expectedScale);
    expect(scene.stage.height()).toBe(HEIGHT * expectedScale);

    scene.destroy();
  });

  it("removes the resize listener and destroys the stage", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const scene = createScene();
    const destroySpy = vi.spyOn(scene.stage, "destroy");

    document.body.style.cursor = "pointer";

    scene.destroy();

    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
    expect(document.body.style.cursor).toBe("default");
  });
});
