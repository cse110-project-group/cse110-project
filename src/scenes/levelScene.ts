import Konva from "konva";
import { loadImage } from "../systems/loadImage";
import { createButton } from "../UI/createButton";
import { fitStageToWindow } from "./mainMenu";

const WIDTH = 1280;
const HEIGHT = 720;
const LEVEL_TEXT_OFFSET_Y = -27;

let levelAssetsPromise:
  | Promise<[HTMLImageElement, HTMLImageElement, HTMLImageElement]>
  | undefined;

  function loadLevelAssets() {
  if (!levelAssetsPromise) {
    levelAssetsPromise = Promise.all([
      loadImage("/assets/background2.png"),
      loadImage("/assets/button.png"),
      loadImage("/assets/Locked_Level.png"),
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
} catch (err) {
  console.error(err);
  return undefined;
}

  // Create the Stage and Layer.
  const stage = new Konva.Stage({
    container: "container",
    width: WIDTH,
    height: HEIGHT,
  });

  const levelLayer = new Konva.Layer({
    imageSmoothingEnabled: false,
  });

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
      y: 70,
      width: WIDTH,
      align: "center",
      fontSize: 56,
      fontStyle: "bold",
      fill: "white",
    })
  );

  // Level button dimensions and spacing.
  const totalLevels = 12;
  const columns = 4;

  const btnW = 190;
  const btnH = 100;

  const gapX = 260;
  const gapY = 125;

  const startX = WIDTH / 2 - ((columns - 1) * gapX) / 2;
  const startY = 240;

  // Create the level buttons in a 4x3 grid.
  for (let level = 1; level <= totalLevels; level++) {
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
      textOffsetY: LEVEL_TEXT_OFFSET_Y,
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
  stage.add(levelLayer);

  // Fit the screen to the browser window.
  fitStageToWindow(stage);

  const onResize = () => fitStageToWindow(stage);
  window.addEventListener("resize", onResize);

  // Return the Stage and cleanup function.
  return {
    stage,
    destroy: () => {
      window.removeEventListener("resize", onResize);
      document.body.style.cursor = "default";
      stage.destroy();
    },
  };
}

export async function preloadLevelAssets(): Promise<boolean> {
  try {
    await loadLevelAssets();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}