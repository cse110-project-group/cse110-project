import Konva from "konva";
import { loadCachedImage, resetImageCache } from "../systems/imageCache";
import { createButton } from "../UI/createButton";
import { createScene, WIDTH, HEIGHT } from "./sceneUtils";


// Cache the assets needed for the Mini Games screen.
let miniGameAssetsPromise:
 | Promise<[HTMLImageElement, HTMLImageElement]>
 | undefined;


// Reset cached assets between tests.
export function resetMiniGameAssets(): void {
 miniGameAssetsPromise = undefined;
 resetImageCache();
}


// Load images used by the Mini Games screen.
function loadMiniGameAssets() {
 if (!miniGameAssetsPromise) {
   miniGameAssetsPromise = Promise.all([
     loadCachedImage("/assets/background2.png"),
     loadCachedImage("/assets/button.png"),
   ]).catch((err) => {
     miniGameAssetsPromise = undefined;
     throw err;
   });
 }


 return miniGameAssetsPromise;
}

// The running Mini Games screen and its cleanup function.
export interface MiniGameScene {
 stage: Konva.Stage;
 destroy: () => void;
}


// Creates the Mini Games selection screen.
export async function initMiniGameScene(
 onBack: () => void,
 onSelectMiniGame: (gameId: number) => void
): Promise<MiniGameScene | undefined> {
 let bgImg: HTMLImageElement;
 let buttonImg: HTMLImageElement;


 // Load the images before creating the Stage.
 try {
   [bgImg, buttonImg] = await loadMiniGameAssets();
 } catch (err) {
   console.error(err);
   return undefined;
 }


 // Create the Stage and Layer.
 const { stage, layer, destroy } = createScene();


 // Add the background.
 layer.add(
   new Konva.Image({
     image: bgImg,
     width: WIDTH,
     height: HEIGHT,
   })
 );


 
}