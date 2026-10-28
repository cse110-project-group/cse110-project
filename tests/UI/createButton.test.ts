// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../helpers/canvasStub.ts";
import Konva from "konva";
import { createButton } from "../../src/UI/createButton.ts";

// Builds a button with sensible defaults; each test overrides only what it cares about.
// vi.fn() makes a "spy" function that records whether/how it was called.
function makeButton(overrides: Partial<Parameters<typeof createButton>[0]> = {}) {
  const onClick = vi.fn();
  const button = createButton({
    image: new Image(),
    label: "Play",
    x: 100,
    y: 200,
    width: 300,
    height: 100,
    onClick,
    ...overrides,
  });
  return { button, onClick };
}

describe("createButton", () => {
  beforeEach(() => {
    document.body.style.cursor = "default"; // reset shared state between tests
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.cursor = "default";
  });

  it("returns a Konva group positioned at x, y", () => {
    const { button } = makeButton();
    expect(button).toBeInstanceOf(Konva.Group);
    expect(button.x()).toBe(100);
    expect(button.y()).toBe(200);
  });

  it("sets the origin to the button's center", () => {
    const { button } = makeButton();
    expect(button.offsetX()).toBe(150); // width / 2
    expect(button.offsetY()).toBe(50);  // height / 2
  });

  it("draws the image at the requested size", () => {
    const { button } = makeButton();
    const img = button.findOne<Konva.Image>("Image");
    expect(img).toBeDefined();
    expect(img!.width()).toBe(300);
    expect(img!.height()).toBe(100);
  });

  it("adds a text node when a label is given", () => {
    const { button } = makeButton({ label: "Options" });
    const text = button.findOne<Konva.Text>("Text");
    expect(text).toBeDefined();
    expect(text!.text()).toBe("Options");
  });

  it("adds no text node when the label is omitted", () => {
    const { button } = makeButton({ label: undefined });
    expect(button.findOne("Text")).toBeUndefined();
  });

  it("calls onClick on click and on tap", () => {
    const { button, onClick } = makeButton();
    button.fire("click");
    button.fire("tap");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("shows a pointer cursor on hover and resets it on leave", () => {
    const { button } = makeButton();
    button.fire("mouseenter");
    expect(document.body.style.cursor).toBe("pointer");
    button.fire("mouseleave");
    expect(document.body.style.cursor).toBe("default");
  });
});