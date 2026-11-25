import Konva from "konva";
import { createScene, WIDTH, HEIGHT } from "./sceneUtils";
import { createButton } from "../UI/createButton";
import { loadCachedImage } from "../systems/imageCache";

// The running completion screen and its cleanup function.
export interface CompletionScene {
  stage: Konva.Stage;
  destroy: () => void;
}

// Preload the Completion Screen assets before switching scenes.
export async function preloadCompletionAssets(): Promise<boolean> {
  try {
    await loadCachedImage("/assets/button.png");
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// Creates the completion screen after all levels are finished.
export async function initCompletionScene(
  onMainMenu: () => void,
  onLevels: () => void
): Promise<CompletionScene | undefined> {
  let buttonImg: HTMLImageElement;

  // Load assets before creating the Stage.
  try {
    buttonImg = await loadCachedImage("/assets/button.png");
  } catch (err) {
    console.error(err);
    return undefined;
  }

  // Create the Stage and Layer.
  const { stage, layer, destroy } = createScene();

  // Add the background.
  layer.add(
    new Konva.Rect({
      width: WIDTH,
      height: HEIGHT,
      fill: "#111536",
    })
  );

  // Add the completion title.
  layer.add(
    new Konva.Text({
      text: "CONGRATULATIONS!",
      x: 0,
      y: 100,
      width: WIDTH,
      align: "center",
      fontSize: 58,
      fontStyle: "bold",
      fill: "#FFE18A",
    })
  );

  // Add the completion message.
  layer.add(
    new Konva.Text({
      text: "You completed all 12 levels!",
      x: 0,
      y: 220,
      width: WIDTH,
      align: "center",
      fontSize: 36,
      fill: "white",
    })
  );

  // Add achievement text.
  layer.add(
    new Konva.Text({
      text: "12 / 12 LEVELS COMPLETED",
      x: 0,
      y: 315,
      width: WIDTH,
      align: "center",
      fontSize: 30,
      fontStyle: "bold",
      fill: "#FCD56B",
    })
  );

  // Add Main Menu button.
  layer.add(
    createButton({
      image: buttonImg,
      label: "Main Menu",
      x: WIDTH / 2,
      y: 455,
      width: 260,
      height: 80,
      onClick: onMainMenu,
    })
  );

  // Add View Levels button.
  layer.add(
    createButton({
      image: buttonImg,
      label: "View Levels",
      x: WIDTH / 2,
      y: 565,
      width: 260,
      height: 80,
      onClick: onLevels,
    })
  );

  // Return the Stage and cleanup function.
  return {
    stage,
    destroy,
  };
}
