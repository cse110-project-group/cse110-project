// src/mainMenu.ts
import Konva from "konva";
import { loadCachedImage, resetImageCache } from "../systems/imageCache";
import { createButton } from "../UI/createButton";
import { createScene, WIDTH, HEIGHT } from "./sceneUtils";

let mainMenuAssetsPromise:
  | Promise<[HTMLImageElement, HTMLImageElement]>
  | undefined;


// Reset cached assets between tests.
export function resetMainMenuAssets(): void {
  mainMenuAssetsPromise = undefined;
  resetImageCache();
}

// Load images once and reuse them when returning to the menu.
function loadMainMenuAssets() {
  if (!mainMenuAssetsPromise) {
    mainMenuAssetsPromise = Promise.all([
      loadCachedImage("/assets/background2.png"),
      loadCachedImage("/assets/button.png"),
    ]).catch((err) => {
      mainMenuAssetsPromise = undefined;
      throw err;
    });
  }

  
  return mainMenuAssetsPromise;
}

// Check that menu images load before switching scenes.
export async function preloadMainMenuAssets(): Promise<boolean> {
  try {
    await loadMainMenuAssets();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}


// The running menu: its stage, and a way to tear everything down.
export interface MainMenu {
  stage: Konva.Stage;
  destroy: () => void;
}

// Scale the stage to fit the window while keeping the aspect ratio.
export { fitStageToWindow } from "../scenes/sceneUtils";

// onStart runs when Start Game is clicked.
export async function init(onStart: () => void, onLevels: () => void): Promise<MainMenu | undefined> {
  let bgImg: HTMLImageElement;
  let playImg: HTMLImageElement;

// Load images before creating the stage, so a failed load leaves no blank canvas.
try {
  [bgImg, playImg] = await loadMainMenuAssets();
} 
catch (err) {
  console.error(err);
  return undefined;
}

  const { stage, layer: menuLayer, destroy } = createScene();

  menuLayer.add(
    new Konva.Image({ image: bgImg, width: WIDTH, height: HEIGHT })
  );

  const btnW = 50 * 5;
  const btnH = 15 * 5;
  const buttonX = WIDTH / 2 - 190;
  const startY = 330;
  const gap = 110;

  const buttons = [
    { label: "Start Game", onClick: onStart },
    { label: "Levels", onClick: onLevels },
    { label: "Options", onClick: () => console.log("Options clicked") },
  ];

  buttons.forEach(({ label, onClick }, i) => {
    menuLayer.add(
      createButton({
        image: playImg,
        label,
        x: buttonX,
        y: startY + gap * i,
        width: btnW,
        height: btnH,
        onClick,
      })
    );
  });

  stage.add(menuLayer);

  return {
    stage,
    destroy,
  };
}