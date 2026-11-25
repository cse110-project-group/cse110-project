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

// Add the title.
 layer.add(
   new Konva.Text({
     text: "MINI GAMES",
     x: 0,
     y: 65,
     width: WIDTH,
     align: "center",
     fontSize: 56,
     fontStyle: "bold",
     fill: "orange",
   })
 );


 // Create the two Mini Game buttons.
 const miniGames = [
   { id: 1, label: "Mini Game 1" },
   { id: 2, label: "Mini Game 2" },
 ];


 const btnW = 260;
 const btnH = 100;
 const gapX = 340;
 const startX = WIDTH / 2 - gapX / 2;
 const buttonY = 350;


 miniGames.forEach((game, index) => {
   const miniGameButton = createButton({
     image: buttonImg,
     label: game.label,
     x: startX + index * gapX,
     y: buttonY,
     width: btnW,
     height: btnH,
     onClick: () => onSelectMiniGame(game.id),
   });


   layer.add(miniGameButton);
 });


 // Create the Back button.
 layer.add(
   createButton({
     image: buttonImg,
     label: "Back",
     x: WIDTH / 2,
     y: 580,
     width: 220,
     height: 75,
     onClick: onBack,
   })
 );


 return {
   stage,
   destroy,
 };
 
}

// Preload assets before transitioning to this screen.
export async function preloadMiniGameAssets(): Promise<boolean> {
 try {
   await loadMiniGameAssets();
   return true;
 } catch (err) {
   console.error(err);
   return false;
 }
}
