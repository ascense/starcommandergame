// -- Globals --

var SC_VERSION = "1.04";

var view,
	state,
	game,
	input;


// -- Initialization --

function init() {
	var canvas = $("#game-canvas")[0];
	
	view = new View(canvas);
	state = new State();
	game = new Game();
	input = new Input();
	
	game.newGame();
	
	tick();
}


// -- Main Loop --

function tick() {
	window.requestAnimationFrame(tick);
	
	game.tick();
	
	view.draw(game.getScene());
}
