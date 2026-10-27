import Konva from "konva";

/**
 * Properties and type of the button, text is optional
 */

interface ButtonOptions {
  image: HTMLImageElement;
  label?: string;          
  x: number;
  y: number;
  width: number;
  height: number;
  onClick: () => void;
}

/**
 * Creates an interactive image button made of a Konva group
 * 
 * The button grows slightly on hover, shrinks while pressed, and calls
 * `onClick` when clicked or tapped. It is returned but not added to a layer,
 * so the caller decides where it appears.
 * 
 * @param image: chosen png asset
 * @param label: chosen text of the button
 * @param x: chosen x postion of the button
 * @param y: chosen y position of the button
 * @param width: chosen width of the button
 * @param height: chosen height of the button
 * @param onClick: calls action provided when button is clicked
 * @returns 
 */
export function createButton(opts: ButtonOptions): Konva.Group {
  const { image, label, x, y, width, height, onClick } = opts;

  // The group is the "button": position, scale, and events live here.
  const button = new Konva.Group({
    x,
    y,
    offsetX: width / 2,
    offsetY: height / 2,
  });

  // Children are positioned relative to the group's top-left (0, 0).
  button.add(new Konva.Image({ image, width, height }));

  // Adds text only if a label is provided
  if (label) {
    button.add(
      new Konva.Text({
        text: label,
        width,
        height,
        align: "center",
        verticalAlign: "middle",
        fontSize: 32,
        fontStyle: "bold",
        fill: "white",
      })
    );
  }

  // Each button animates itself to the given scale for a duration of 0.1 
  // seconds
  const tweenTo = (scale: number) =>
    new Konva.Tween({
      node: button,
      duration: 0.1,
      scaleX: scale,
      scaleY: scale,
      easing: Konva.Easings.EaseOut,
    }).play();

    // Hover: show a pointer cursor and enlarge slightly using tweenTo.
    button.on("mouseenter", () => {
        document.body.style.cursor = "pointer";
        tweenTo(1.08);
    });

    // Hover off: returns mouse to its original pointer and returns the button 
    // to its original size
    button.on("mouseleave", () => {
        document.body.style.cursor = "default";
        tweenTo(1);
    });

    button.on("mousedown touchstart", () => tweenTo(0.95));

    button.on("mouseup touchend", () => tweenTo(1.08));

    button.on("click tap", onClick);

    return button;
}