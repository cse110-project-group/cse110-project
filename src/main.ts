import Konva from 'konva';
import Input from './systems/input.ts'

const input = new Input();

// first we need to create a stage
const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight
});

// then create layer
const layer = new Konva.Layer();

// create our shape
const circle = new Konva.Ellipse({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radiusX: 25,
  radiusY: 50,
  fill: 'gray',
});

// add the shape to the layer
layer.add(circle);

// add the layer to the stage
stage.add(layer);

function main() {
	stage.container().focus();

	gameLoop()
}

function gameLoop() {
	const X = 10;

	if(input.isKeyDown('KeyA'))
		circle.x(circle.x() - X);
	else if(input.isKeyDown('KeyD'))
		circle.x(circle.x() + X);

	requestAnimationFrame(gameLoop);
}

main();
