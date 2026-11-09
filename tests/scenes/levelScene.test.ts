// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Konva from 'konva';
import { initLevelSelect } from '../../src/scenes/levelScene';
import { loadImage } from '../../src/systems/loadImage';

// Use the same canvasStub import/setup as mainMenu.test.ts.
import '../helpers/canvasStub';

// Mock image loading so tests don't depend on actual image files.
vi.mock('../../src/systems/loadImage', () => ({
  loadImage: vi.fn(),
}));

// Change the browser window dimensions for resize tests.
function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  });
}

// Find a button group by the text inside it.
function findButton(layer: Konva.Layer, label: string): Konva.Group {
  const groups = layer.find<Konva.Group>('Group');

  const button = groups.find((group) => {
    return group.find<Konva.Text>('Text').some((node) => {
      return node.text() === label;
    });
  });

  if (!button) {
    throw new Error(`Button "${label}" not found`);
  }

  return button;
}

describe('Level Selection Screen', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="container"></div>';

    setWindowSize(1280, 720);

    vi.mocked(loadImage).mockReset();

    // Return a fake image rather than loading real assets.
    vi.mocked(loadImage).mockResolvedValue(
      document.createElement('canvas') as unknown as HTMLImageElement
    );
  });

  afterEach(() => {
    // Remove any Konva stages remaining after the test.
    Konva.stages.forEach((stage) => stage.destroy());

    document.body.style.cursor = 'default';
    document.body.innerHTML = '';

    vi.restoreAllMocks();
  });

  // TEST 1: Screen initializes successfully.
  it('creates the level selection screen', async () => {
    const screen = await initLevelSelect(vi.fn());

    expect(screen).toBeDefined();
    expect(screen!.stage).toBeInstanceOf(Konva.Stage);

    screen!.destroy();
  });

  // TEST 2: Background and title exist.
  it('creates a background and title', async () => {
    const screen = await initLevelSelect(vi.fn());

    expect(screen).toBeDefined();

    const layer = screen!.stage.getLayers()[0];

    const images = layer.find('Image');
    expect(images.length).toBeGreaterThan(0);

    const title = layer.find('Text').find((node) => {
      return (node as Konva.Text).text() === 'LEVEL SELECT';
    });

    expect(title).toBeDefined();

    screen!.destroy();
  });

  // TEST 3: All 12 level buttons exist.
  it('creates 12 level buttons', async () => {
    const screen = await initLevelSelect(vi.fn());

    expect(screen).toBeDefined();

    const layer = screen!.stage.getLayers()[0];

    for (let level = 1; level <= 12; level++) {
      const button = findButton(layer, `Level ${level}`);

      expect(button).toBeDefined();
    }

    screen!.destroy();
  });

  // TEST 4: Level buttons respond to clicks.
  it('allows clicking a level button', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const screen = await initLevelSelect(vi.fn());

    expect(screen).toBeDefined();

    const layer = screen!.stage.getLayers()[0];
    const levelButton = findButton(layer, 'Level 1');

    levelButton.fire('click');

    expect(logSpy).toHaveBeenCalledWith('Level 1 clicked');

    screen!.destroy();
  });

  // TEST 5: Back button triggers its callback.
  it('calls onBack when Back is clicked', async () => {
    const onBack = vi.fn();

    const screen = await initLevelSelect(onBack);

    expect(screen).toBeDefined();

    const layer = screen!.stage.getLayers()[0];
    const backButton = findButton(layer, 'Back');

    backButton.fire('click');

    expect(onBack).toHaveBeenCalledTimes(1);

    screen!.destroy();
  });

  // TEST 6: Stage resizes to fit the window.
  it('scales the stage when the window is resized', async () => {
    const screen = await initLevelSelect(vi.fn());

    expect(screen).toBeDefined();

    setWindowSize(640, 360);
    window.dispatchEvent(new Event('resize'));

    expect(screen!.stage.width()).toBe(640);
    expect(screen!.stage.height()).toBe(360);

    expect(screen!.stage.scaleX()).toBe(0.5);
    expect(screen!.stage.scaleY()).toBe(0.5);

    screen!.destroy();
  });

  // TEST 7: Image loading errors are handled.
  it('handles an image loading failure', async () => {
    vi.mocked(loadImage).mockRejectedValueOnce(
      new Error('Failed to load image')
    );

    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const screen = await initLevelSelect(vi.fn());

    expect(screen).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });

  // TEST 8: Destroy cleans up the screen.
  it('destroys the stage when leaving the screen', async () => {
    const screen = await initLevelSelect(vi.fn());

    expect(screen).toBeDefined();

    const stage = screen!.stage;
    const destroySpy = vi.spyOn(stage, 'destroy');

    screen!.destroy();

    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(Konva.stages).not.toContain(stage);
    });
});
