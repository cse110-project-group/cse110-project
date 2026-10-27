import { describe, it, expect, vi, afterEach } from "vitest";
import { loadImage } from "../../src/systems/loadImage";

// Replaces the browser's Image with a fake that "finishes loading" (or fails)
// as soon as src is set.
function stubImage(outcome: "load" | "error") {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private _src = "";

    get src() {
      return this._src;
    }
    set src(value: string) {
      this._src = value;
      // Fire asynchronously, like a real image, after handlers are attached.
      setTimeout(() => {
        if (outcome === "load") this.onload?.();
        else this.onerror?.();
      }, 0);
    }
  }
  vi.stubGlobal("Image", FakeImage);
}

describe("loadImage", () => {
  // Restore the real Image after each test so tests don't affect each other.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves with the image once it loads", async () => {
    stubImage("load");
    const img = await loadImage("/assets/button.png");
    expect(img.src).toBe("/assets/button.png");
  });

  it("rejects with an error naming the URL when loading fails", async () => {
    stubImage("error");
    await expect(loadImage("/assets/missing.png")).rejects.toThrow(
      "Failed to load /assets/missing.png"
    );
  });
});