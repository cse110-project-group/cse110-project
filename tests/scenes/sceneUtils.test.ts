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

    const createdScenes: ReturnType<typeof createScene>[] = [];

    function makeScene() {
        const scene = createScene();
        createdScenes.push(scene);
        return scene;
    }

    beforeEach(() => {
        container = document.createElement("div");
        container.id = "container";
        document.body.appendChild(container);

    setWindowSize(1280, 720);
    });

    afterEach(() => {
    createdScenes.forEach((scene) => scene.destroy());
    createdScenes.length = 0;

    Konva.stages.forEach((stage) => stage.destroy());
    container.remove();
    vi.restoreAllMocks();
    });

    it("creates a stage and layer", () => {
        const scene = makeScene();

        expect(scene.stage).toBeInstanceOf(Konva.Stage);
        expect(scene.layer).toBeInstanceOf(Konva.Layer);
        expect(scene.stage.getLayers().length).toBe(1);
        expect(scene.stage.getLayers()[0]).toBe(scene.layer);

        scene.destroy();
    });

    it("scales the stage while preserving aspect ratio", () => {
        setWindowSize(640, 360);

        const scene = makeScene();

        expect(scene.stage.width()).toBe(640);
        expect(scene.stage.height()).toBe(360);
        expect(scene.stage.scaleX()).toBe(0.5);
        expect(scene.stage.scaleY()).toBe(0.5);

        scene.destroy();
    });

    it("updates the stage when the window is resized", () => {
        const scene = makeScene();

        setWindowSize(960, 720);
        window.dispatchEvent(new Event("resize"));

        const expectedScale = 0.75;

        expect(scene.stage.scaleX()).toBe(expectedScale);
        expect(scene.stage.scaleY()).toBe(expectedScale);
        expect(scene.stage.width()).toBe(WIDTH * expectedScale);
        expect(scene.stage.height()).toBe(HEIGHT * expectedScale);

        scene.destroy();
    });

    it("removes the original resize listener and destroys the stage", () => {
        const addSpy = vi.spyOn(window, "addEventListener");
        const removeSpy = vi.spyOn(window, "removeEventListener");

        const scene = makeScene();
        const destroySpy = vi.spyOn(scene.stage, "destroy");

        const resizeCall = addSpy.mock.calls.find(
            ([event]) => event === "resize"
        );

        expect(resizeCall).toBeDefined();

        const originalHandler = resizeCall![1];

        document.body.style.cursor = "pointer";

        scene.destroy();

        expect(destroySpy).toHaveBeenCalledTimes(1);

        // Must remove the exact handler originally registered.
        expect(removeSpy).toHaveBeenCalledWith(
            "resize",
            originalHandler
        );

        expect(document.body.style.cursor).toBe("default");
    });
});
