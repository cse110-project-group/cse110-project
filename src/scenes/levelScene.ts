import Konva from "konva";
import { loadCachedImage, resetImageCache } from "../systems/imageCache";
import { createButton } from "../UI/createButton";
import { createScene, WIDTH, HEIGHT } from "./sceneUtils";

export const TOTAL_LEVELS = 12;

let levelAssetsPromise:
  | Promise<[HTMLImageElement, HTMLImageElement, HTMLImageElement]>
  | undefined;

// Reset cached level assets between tests.
export function resetLevelAssets(): void {
  levelAssetsPromise = undefined;
  resetImageCache();
}

function loadLevelAssets() {
  if (!levelAssetsPromise) {
    levelAssetsPromise = Promise.all([
      loadCachedImage("/assets/background2.png"),
      loadCachedImage("/assets/button.png"),
      loadCachedImage("/assets/Locked_Level.png"),
    ]).catch((err) => {
      levelAssetsPromise = undefined;
      throw err;
    });
  }

  return levelAssetsPromise;
}

// The running level screen and its cleanup function.
export interface LevelSelect {
  stage: Konva.Stage;
  destroy: () => void;
}

// Creates the level selection screen.
export async function initLevelSelect(
  onBack: () => void
): Promise<LevelSelect | undefined> {
  let bgImg: HTMLImageElement;
  let buttonImg: HTMLImageElement;
  let Locked_LevelImg: HTMLImageElement;

  // Load images before creating the Stage.
  try {
    [bgImg, buttonImg, Locked_LevelImg] = await loadLevelAssets();
  } 
  catch (err) {
    console.error(err);
    return undefined;
  }

  // Create the Stage and Layer.
  const { stage, layer: levelLayer, destroy } = createScene();

  // Add the background.
  levelLayer.add(
    new Konva.Image({
      image: bgImg,
      width: WIDTH,
      height: HEIGHT,
    })
  );

  // Add the title.
  levelLayer.add(
    new Konva.Text({
      text: "LEVEL SELECT",
      x: 0,
      y: 40,
      width: WIDTH,
      align: "center",
      fontSize: 56,
      fontStyle: "bold",
      fill: "orange",
    })
  );

  // Level button dimensions and spacing.
  const columns = 4;

  const btnW = 190;
  const btnH = 100;

  const gapX = 260;
  const gapY = 155;

  const startX = WIDTH / 2 - ((columns - 1) * gapX) / 2;
  const startY = 225;

  // Create the level buttons in a 4x3 grid.
  for (let level = 1; level <= TOTAL_LEVELS; level++) {
    const index = level - 1;

    const col = index % columns;
    const row = Math.floor(index / columns);

    const x = startX + col * gapX;
    const y = startY + row * gapY;

    const levelButton = createButton({
      image: Locked_LevelImg,
      label: `Level ${level}`,
      x,
      y,
      width: btnW,
      height: btnH,
      labelPosition: "above",
      labelBackground: true,
      onClick: () => {},
    });

    levelButton.listening(false);

    levelLayer.add(levelButton);
    
  }
  
  // Create a Back button.
  levelLayer.add(
    createButton({
      image: buttonImg,
      label: "Back",
      x: WIDTH / 2,
      y: 650,
      width: 220,
      height: 75,
      onClick: onBack,
    })
  );

  // Add the Layer to the Stage.
  return {
    stage,
    destroy,
  };
}

export async function preloadLevelAssets(): Promise<boolean> {
  try {
    await loadLevelAssets();
    return true;
  } 
  catch (err) {
    console.error(err);
    return false;
  }
}