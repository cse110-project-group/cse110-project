// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadImage } from "../../src/systems/loadImage";
import {
  loadCachedImage,
  resetImageCache,
} from "../../src/systems/imageCache";

// Mock image loading so tests do not depend on real assets.
vi.mock("../../src/systems/loadImage", () => ({
  loadImage: vi.fn(),
}));

describe("imageCache", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetImageCache();
  });

  it("loads an image when it is not cached", async () => {
    const image = {} as HTMLImageElement;
    vi.mocked(loadImage).mockResolvedValue(image);

    const result = await loadCachedImage("/assets/button.png");

    expect(result).toBe(image);
    expect(loadImage).toHaveBeenCalledWith("/assets/button.png");
    expect(loadImage).toHaveBeenCalledTimes(1);
  });

  it("reuses an image that has already been loaded", async () => {
    const image = {} as HTMLImageElement;
    vi.mocked(loadImage).mockResolvedValue(image);

    const first = await loadCachedImage("/assets/button.png");
    const second = await loadCachedImage("/assets/button.png");

    expect(first).toBe(second);
    expect(loadImage).toHaveBeenCalledTimes(1);
  });

  it("shares an image request while it is loading", async () => {
    let finishLoading!: (image: HTMLImageElement) => void;

    const pending = new Promise<HTMLImageElement>((resolve) => {
      finishLoading = resolve;
    });

    vi.mocked(loadImage).mockReturnValue(pending);

    const first = loadCachedImage("/assets/button.png");
    const second = loadCachedImage("/assets/button.png");

    const image = {} as HTMLImageElement;
    finishLoading(image);

    expect(await first).toBe(image);
    expect(await second).toBe(image);
    expect(loadImage).toHaveBeenCalledTimes(1);
  });

  it("removes failed images from the cache so they can be retried", async () => {
    const image = {} as HTMLImageElement;

    vi.mocked(loadImage)
      .mockRejectedValueOnce(new Error("Image failed to load"))
      .mockResolvedValueOnce(image);

    await expect(
      loadCachedImage("/assets/missing.png")
    ).rejects.toThrow("Image failed to load");

    const result = await loadCachedImage("/assets/missing.png");

    expect(result).toBe(image);
    expect(loadImage).toHaveBeenCalledTimes(2);
  });

  it("loads the image again after resetting the cache", async () => {
    const image = {} as HTMLImageElement;
    vi.mocked(loadImage).mockResolvedValue(image);

    await loadCachedImage("/assets/button.png");

    resetImageCache();

    await loadCachedImage("/assets/button.png");

    expect(loadImage).toHaveBeenCalledTimes(2);
  });
});
