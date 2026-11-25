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

  
});
