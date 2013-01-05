// -- Globals --

var view;
var scene;
var input;


// -- Initialization --

function init() {
	var canvas = $("#game-canvas")[0];
	
	view = new renderer(canvas);
	scene = new game();
	input = new controller();
	
	tick();
}


// -- Main Loop --

function tick() {
	window.requestAnimationFrame(tick);
	
	// input.tick();
	scene.tick();
	
	view.draw(scene);
}
