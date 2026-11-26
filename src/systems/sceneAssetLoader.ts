
import { loadCachedImage } from "./imageCache";

export function createSceneAssetLoader<T extends readonly string[]>(
  paths: T
) {
  type Images = { [K in keyof T]: HTMLImageElement };

  let assetsPromise: Promise<Images> | undefined;

  function load(): Promise<Images> {
    if (!assetsPromise) {
      assetsPromise = (
        Promise.all(paths.map((path) => loadCachedImage(path))) as Promise<Images>
      ).catch((err) => {
        assetsPromise = undefined;
        throw err;
      });
    }

    return assetsPromise;
  }

  async function preload(): Promise<boolean> {
    try {
      await load();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  function reset(): void {
    assetsPromise = undefined;
  }

  return { load, preload, reset };
}
