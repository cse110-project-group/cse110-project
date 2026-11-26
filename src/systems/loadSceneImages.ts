import { loadCachedImage } from "./imageCache";

export function loadSceneImages(
  paths: string[]
): Promise<HTMLImageElement[]> {
  return Promise.all(paths.map(loadCachedImage));
}