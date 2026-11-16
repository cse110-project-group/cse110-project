
import Konva from "konva";

const WIDTH = 1280;
const HEIGHT = 720;

// Scale the stage to fit the window while keeping the aspect ratio.
export function fitStageToWindow(stage: Konva.Stage): void {
  const scale = Math.min(
    window.innerWidth / WIDTH,
    window.innerHeight / HEIGHT
  );

  stage.width(WIDTH * scale);
  stage.height(HEIGHT * scale);
  stage.scale({ x: scale, y: scale });
}

// Create a scene with shared setup and cleanup.
export function createScene() {
  const stage = new Konva.Stage({
    container: "container",
    width: WIDTH,
    height: HEIGHT,
  });

  const layer = new Konva.Layer({
    imageSmoothingEnabled: false,
  });

  stage.add(layer);

  fitStageToWindow(stage);

  const onResize = () => fitStageToWindow(stage);
  window.addEventListener("resize", onResize);

  return {
    stage,
    layer,
    destroy: () => {
      window.removeEventListener("resize", onResize);
      document.body.style.cursor = "default";
      stage.destroy();
    },
  };
}
