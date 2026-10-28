/**
 * Loads an image from a URL and returns it once it is ready to draw.
 *
 * Browsers load images asynchronously, so an image can't be used right
 * after setting its `src`. This wraps the browser's `onload`/`onerror`
 * events in a Promise, so callers can simply `await` the result.
 *
 * @param src - URL of the image, e.g. "/assets/button.png".
 * @returns A promise that resolves with the loaded image, or rejects with
 * an Error naming the URL if the image fails to load.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    
    img.src = src;
  });
}