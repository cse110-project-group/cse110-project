// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadImage } from "../../src/systems/loadImage.ts";

// Replaces the browser's Image constructor with a fake Image class.
// This allows tests to simulate successful or failed loading without
// downloading actual image files.
function stubImage(outcome: "load" | "error") {
  class FakeImage {

    // Stores the callbacks assigned by loadImage().
    // Each callback is initially null until the function assigns it.
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    // Stores the image source internally.
    // private restricts direct access outside the class in TypeScript.
    private _src = "";

    // Getter returns the stored image URL when img.src is accessed.
    get src() {
      return this._src;
    }

    // Setter runs when img.src is assigned a value.
    // Stores the URL and schedules a simulated loading result.
    set src(value: string) {
      this._src = value;

      // setTimeout() simulates asynchronous image loading.
      // Depending on outcome, it triggers either the success
      // or error callback after the current execution completes.
      setTimeout(() => {
        if (outcome === "load") this.onload?.();
        else this.onerror?.();
      }, 0);
    }
  }

  // Temporarily replaces the global Image constructor with FakeImage.
  // Any new Image() call will now create a FakeImage object.
  vi.stubGlobal("Image", FakeImage);
}

// Groups the tests for the loadImage() utility.
describe("loadImage", () => {

  // Restores the original browser Image constructor after each test
  // so the fake implementation does not affect other tests.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Tests that loadImage() resolves its Promise when loading succeeds
  // and returns an image containing the correct source URL.
  it("resolves with the image once it loads", async () => {
    stubImage("load");
    const img = await loadImage("/assets/button.png");
    expect(img.src).toBe("/assets/button.png");
  });

  // Tests that loadImage() rejects its Promise when loading fails.
  // .rejects.toThrow() verifies that the error message includes
  // the URL of the image that failed to load.
  it("rejects with an error naming the URL when loading fails", async () => {
    stubImage("error");
    await expect(loadImage("/assets/missing.png")).rejects.toThrow(
      "Failed to load /assets/missing.png"
    );
  });
});
