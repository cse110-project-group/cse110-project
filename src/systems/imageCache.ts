import { loadImage } from "./loadImage";

const imageCache = new Map<string, Promise<HTMLImageElement>>();

// Load each image only once, even if multiple scenes use it.
export function loadCachedImage(path: string): Promise<HTMLImageElement> {
  let promise = imageCache.get(path);

  if (!promise) {
    promise = loadImage(path).catch((err) => {
      imageCache.delete(path);
      throw err;
    });

    imageCache.set(path, promise);
  }

  return promise;
}

// Clear cached images for tests.
export function resetImageCache(): void {
  imageCache.clear();
}
