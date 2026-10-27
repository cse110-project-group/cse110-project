import Konva from "konva";

interface ButtonOptions {
  image: HTMLImageElement;
  label?: string;          // optional text drawn on the button
  x: number;
  y: number;
  width: number;
  height: number;
  onClick: () => void;
}

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

  const tweenTo = (scale: number) =>
    new Konva.Tween({
      node: button,
      duration: 0.1,
      scaleX: scale,
      scaleY: scale,
      easing: Konva.Easings.EaseOut,
    }).play();

  button.on("mouseenter", () => {
    document.body.style.cursor = "pointer";
    tweenTo(1.08);
  });
  button.on("mouseleave", () => {
    document.body.style.cursor = "default";
    tweenTo(1);
  });
  button.on("mousedown touchstart", () => tweenTo(0.95));
  button.on("mouseup touchend", () => tweenTo(1.08));
  button.on("click tap", onClick);

  return button;
}