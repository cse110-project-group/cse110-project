import Konva from "konva";
import { createScene, WIDTH, HEIGHT } from "./sceneUtils";
import { createButton } from "../UI/createButton";
import { loadCachedImage } from "../systems/imageCache";

// The running completion screen and its cleanup function.
export interface CompletionScene {
  stage: Konva.Stage;
  destroy: () => void;
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
}
