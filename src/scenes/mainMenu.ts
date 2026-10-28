// src/mainMenu.ts
import Konva from "konva";
import { loadImage } from "../systems/loadImage";
import { createButton } from "../UI/createButton";

// Virtual resolution: all coordinates below are in this space.
const WIDTH = 1280;
const HEIGHT = 720;

// Scale the stage to fit the window while keeping the aspect ratio.
export function fitStageToWindow(stage: Konva.Stage): void {
  const scale = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
  stage.width(WIDTH * scale);
  stage.height(HEIGHT * scale);
  stage.scale({ x: scale, y: scale });
}

export async function init(): Promise<Konva.Stage | undefined> {
  const stage = new Konva.Stage({
    container: "container", 
    width: WIDTH,
    height: HEIGHT,
  });


  let bgImg: HTMLImageElement;
  let playImg: HTMLImageElement;

  try {
    [bgImg, playImg,] = await Promise.all([
      loadImage("/assets/background2.png"),
      loadImage("/assets/button.png"),
    ]);
  } catch (err) {
    console.error(err);
    return undefined;
  }

  
  const menuLayer = new Konva.Layer({imageSmoothingEnabled: false});

  menuLayer.add(
    new Konva.Image({ image: bgImg, width: WIDTH, height: HEIGHT })
  );

  const btnW = 50 * 5;
  const btnH = 15 * 5;
  const centerX = WIDTH / 2;
  const startY = 330;
  const gap = 110;


  const gameLayer = new Konva.Layer({ visible: false });
  gameLayer.add(
    new Konva.Rect({ width: WIDTH, height: HEIGHT, fill: "#111" })
  );
  gameLayer.add(
    new Konva.Text({
      text: "Game goes here (click to return)",
      fontSize: 36,
      fill: "white",
      width: WIDTH,
      y: HEIGHT / 2 - 18,
      align: "center",
    })
  );

  const showMenu = (): void => {
    gameLayer.hide();
    menuLayer.show();
  };
  const showGame = (): void => {
    menuLayer.hide();
    gameLayer.show();
  };

  gameLayer.on("click tap", showMenu);


  menuLayer.add(
    createButton({
      image: playImg,
      label: 'Start Game',
      x: centerX - 190,
      y: startY,
      width: btnW,
      height: btnH,
      onClick: showGame,
    }),
    createButton({
      image: playImg,
      label: 'Levels',
      x: centerX - 190,
      y: startY + gap,
      width: btnW,
      height: btnH,
      onClick: () => console.log("Levels clicked"),
    }),
    createButton({
      image: playImg,
      label: 'Options',
      x: centerX - 190,
      y: startY + gap * 2,
      width: btnW,
      height: btnH,
      onClick: () => console.log("Options clicked"),
    })
  );

  stage.add(menuLayer, gameLayer);

  fitStageToWindow(stage);
  window.addEventListener("resize", () => fitStageToWindow(stage));

  return stage;
}