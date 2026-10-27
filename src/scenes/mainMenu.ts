// src/mainMenu.ts
import Konva from "konva";
import { loadImage } from "../systems/loadImage";
import { createButton } from "../UI/createButton";

// Virtual resolution: all coordinates below are in this space.
const WIDTH = 1280;
const HEIGHT = 720;

// Scale the stage to fit the window while keeping the aspect ratio.
function fitStageToWindow(stage: Konva.Stage): void {
  const scale = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
  stage.width(WIDTH * scale);
  stage.height(HEIGHT * scale);
  stage.scale({ x: scale, y: scale });
}

async function init(): Promise<void> {
  const stage = new Konva.Stage({
    container: "container", // matches <div id="container"> in index.html
    width: WIDTH,
    height: HEIGHT,
  });

  // Load all images in parallel; stop with a clear error if one fails.
  let bgImg: HTMLImageElement;
  let playImg: HTMLImageElement;

  try {
    [bgImg, playImg,] = await Promise.all([
      loadImage("assets/background2.png"),
      loadImage("/assets/button.png"),
    ]);
  } catch (err) {
    console.error(err);
    return;
  }

  // ---------- Menu screen ----------
  const menuLayer = new Konva.Layer({imageSmoothingEnabled: false});

  menuLayer.add(
    new Konva.Image({ image: bgImg, width: WIDTH, height: HEIGHT })
  );

  const btnW = 50 * 5;
  const btnH = 15 * 5;
  const centerX = WIDTH / 2;
  const startY = 330;
  const gap = 110;

  // ---------- Placeholder game screen ----------
  const gameLayer = new Konva.Layer({ visible: false });
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
  gameLayer.add(
    new Konva.Rect({ width: WIDTH, height: HEIGHT, fill: "#111", opacity: 0.0 })
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

  // ---------- Buttons ----------
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
      onClick: () => console.log("Options clicked"),
    }),
    createButton({
      image: playImg,
      label: 'Options',
      x: centerX - 190,
      y: startY + gap * 2,
      width: btnW,
      height: btnH,
      onClick: () => console.log("Quit clicked"),
    })
  );

  stage.add(menuLayer, gameLayer);

  fitStageToWindow(stage);
  window.addEventListener("resize", () => fitStageToWindow(stage));
}

init();