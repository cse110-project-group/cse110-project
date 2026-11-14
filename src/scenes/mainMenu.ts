// src/mainMenu.ts
import Konva from "konva";
import { loadImage } from "../systems/loadImage";
import { createButton } from "../UI/createButton";

// Virtual resolution: all coordinates below are in this space.
const WIDTH = 1280;
const HEIGHT = 720;

// The running menu: its stage, and a way to tear everything down.
export interface MainMenu {
  stage: Konva.Stage;
  destroy: () => void;
}

// Scale the stage to fit the window while keeping the aspect ratio.
export function fitStageToWindow(stage: Konva.Stage): void {
  const scale = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
  stage.width(WIDTH * scale);
  stage.height(HEIGHT * scale);
  stage.scale({ x: scale, y: scale });
}

// onStart runs when Start Game is clicked.
export async function init(onStart: () => void, onLevels: () => void): Promise<MainMenu | undefined> {
  let bgImg: HTMLImageElement;
  let playImg: HTMLImageElement;

  // Load images before creating the stage, so a failed load leaves no blank canvas.
  try {
    [bgImg, playImg] = await Promise.all([
      loadImage("/assets/background2.png"),
      loadImage("/assets/button.png"),
    ]);
  } catch (err) {
    console.error(err);
    return undefined;
  }

  const stage = new Konva.Stage({
    container: "container",
    width: WIDTH,
    height: HEIGHT,
  });

  const menuLayer = new Konva.Layer({ imageSmoothingEnabled: false });

  menuLayer.add(
    new Konva.Image({ image: bgImg, width: WIDTH, height: HEIGHT })
  );

  const btnW = 50 * 5;
  const btnH = 15 * 5;
  // Buttons sit left of center to line up with the background art.
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

  fitStageToWindow(stage);
  const onResize = () => fitStageToWindow(stage);
  window.addEventListener("resize", onResize);

  return {
    stage,
    destroy: () => {
      window.removeEventListener("resize", onResize);
      // mouseleave never fires on a destroyed button, so reset the cursor here.
      document.body.style.cursor = "default";
      stage.destroy();
    },
  };
}