import Konva from 'konva';

interface ButtonOptions {
    image: HTMLImageElement;
    x: number;
    y: number;
    width: number;
    height: number;
    onClick: () => void;



}

export function createButton(opts: ButtonOptions): Konva.Image {
    const {image, x, y, width, height, onClick} = opts;

    const button = new Konva.Image({
        image,
        x,
        y,
        width,
        height,
        offsetX: width/2,
        offsetY: height/2,
    });

    const tweenTo = (scale: number) => new Konva.Tween ({
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


