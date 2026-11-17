// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../helpers/canvasStub.ts";
import Konva from "konva";
import { createButton } from "../../src/UI/createButton.ts";

// Creates a button with default properties so each test only needs
// to override the values relevant to what it is testing.
// Partial<> allows individual properties to be optional.
// Parameters<typeof createButton>[0] extracts the type of the
// first parameter accepted by createButton().
function makeButton(overrides: Partial<Parameters<typeof createButton>[0]> = {}) {

  // Creates a mock callback to track whether the button was clicked.
  const onClick = vi.fn();

  const button = createButton({
    image: new Image(),
    label: "Play",
    x: 100,
    y: 200,
    width: 300,
    height: 100,
    onClick,

    // Spread syntax replaces default properties with any overrides.
    ...overrides,
  });

  // Returns the button and callback so tests can inspect both.
  return { button, onClick };
}


describe("createButton", () => {

  // Resets the mouse cursor before each test to ensure
  // every test starts with the same cursor state.
  beforeEach(() => {
    document.body.style.cursor = "default";
  });

  // Restores Vitest spies and resets the cursor after each test
  // to prevent one test from affecting another.
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.cursor = "default";
  });

  // Verifies that createButton() returns a Konva.Group
  // positioned at the x and y coordinates provided.
  it("returns a Konva group positioned at x, y", () => {
    const { button } = makeButton();
    expect(button).toBeInstanceOf(Konva.Group);
    expect(button.x()).toBe(100);
    expect(button.y()).toBe(200);
  });

  // Verifies that the button's offset is set to its center.
  // This allows the button to scale around its center when animated.
  // Width 300 / 2 = 150 and height 100 / 2 = 50.
  it("sets the origin to the button's center", () => {
    const { button } = makeButton();
    expect(button.offsetX()).toBe(150);
    expect(button.offsetY()).toBe(50);
  });

  // Verifies that the button contains a Konva.Image node
  // with the width and height specified in ButtonOptions.
  it("draws the image at the requested size", () => {
    const { button } = makeButton();
    const img = button.findOne<Konva.Image>("Image");
    expect(img).toBeDefined();
    expect(img!.width()).toBe(300);
    expect(img!.height()).toBe(100);
  });

  // Verifies that createButton() adds a Konva.Text node
  // displaying the correct label when one is provided.
  it("adds a text node when a label is given", () => {
    const { button } = makeButton({ label: "Options" });
    const text = button.findOne<Konva.Text>("Text");
    expect(text).toBeDefined();
    expect(text!.text()).toBe("Options");
  });

  // Verifies that no Text node is created when label is undefined.
  // This allows the utility to create image-only buttons.
  it("adds no text node when the label is omitted", () => {
    const { button } = makeButton({ label: undefined });
    expect(button.findOne("Text")).toBeUndefined();
  });

  // Simulates both mouse and touchscreen interactions.
  // Verifies that onClick is called once for each event.
  it("calls onClick on click and on tap", () => {
    const { button, onClick } = makeButton();
    button.fire("click");
    button.fire("tap");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  // Verifies that hovering changes the cursor to a pointer
  // and leaving the button restores the default cursor.
  it("shows a pointer cursor on hover and resets it on leave", () => {
    const { button } = makeButton();
    button.fire("mouseenter");
    expect(document.body.style.cursor).toBe("pointer");
    button.fire("mouseleave");
    expect(document.body.style.cursor).toBe("default");
  });
});
