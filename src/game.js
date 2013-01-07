/**
* = Game Module =
*
* game
*  - game.entity
*  - game.map
*/


// -- Game Module --

var game = (function() {
	var state, // current game state, from game.enumState
		stateData = {},
		stateStack = [], // format: [state, camera, entities, uiEntities, stateData]
		entities = [],
		uiEntities = [],
		camera = null,
		sprite_title = null,
		sheet_ship = null,
		sheet_ui = null,
		sheet_menu = null;

	// Constructor
	function game() {
		sprite_title = new renderer.sprite($("#img_title")[0]);
		
		sheet_menu = new renderer.spriteSheet($("#img_menu")[0], 300, 50);
		sheet_ui = new renderer.spriteSheet($("#img_fx")[0], 10, 10);
		sheet_ship = new renderer.spriteSheet($("#img_ship")[0], 50, 100);
		
		newGame();
		
		try {
			enterMenu();
		} catch (err) {
			if (!(err === "state change")) {
				throw(err);
			}
		}
	}
	
	function newGame() {
		stateStack = [];
		entities = [];
		uiEntities = [];
	}
	
	function pushState() {
		var cur_state = [
			state,
			camera,
			entities,
			uiEntities,
			stateData
		];
		
		stateStack.push(cur_state);
	}
	
	function popState() {
		if (stateStack.length == 0)
			return;
		
		var cur_state = stateStack.pop();
		
		state = cur_state[0];
		camera = cur_state[1];
		entities = cur_state[2];
		uiEntities = cur_state[3];
		stateData = cur_state[4];
		
		throw "state change";
	}
	
	function enterMenu() {
		state = game.enumState.MENU;
		entities = [];
		uiEntities = [];
		stateData = {
			selected: 0,
			selectTimer: 0
		};
		
		camera = new game.entity(0, 0);
		
		// menu background
		entities[0] = new game.entity(0, 0);
		entities[0].setSprite(sprite_title);
		
		// menu arrow
		entities[1] = new game.entity(-150, 55);
		entities[1].setSprite(sheet_ui.getSprite(1));
		entities[1].rotate(Math.PI / 2);
		
		// menu entries
		for (var i = 0; i < sheet_menu.length(); i++) {
			entities[i + 2] = new game.physicsEntity(-150 + i * 25, 55 + i * 55, 5, 0, 0.25, 0.01);
			entities[i + 2].setSprite(sheet_menu.getSprite(i));
		}
		
		throw "state change";
	}
	
	function enterPlanet() {
		state = game.enumState.PLANET;
		entities = [];
		uiEntities = [];
		stateData = {};
		
		camera = new game.physicsEntity(0, 0, 0, 0, 0.25, 0.1);
		
		throw "state change";
	}
	
	function enterGalaxy() {
		state = game.enumState.GALAXY;
		entities = [];
		uiEntities = [];
		stateData = {
			selected: 4,
			stars: [1, 2, 3]
		};
		
		camera = new game.physicsEntity(0, 0, 0, 0, 0.25, 0.05);
	
		entities[0] = new game.physicsEntity(100, 100, 0, 0, 0.15, 0.001);
		entities[0].setSprite(sheet_ship.getSprite(0));
		
		entities[1] = new game.entity(0, 0);
		entities[1].setSprite(sheet_ui.getSprite(4));
		
		entities[2] = new game.entity(0, 0);
		entities[2].setSprite(sheet_ui.getSprite(5));
		
		entities[3] = new game.entity(0, 0);
		entities[3].setSprite(sheet_ui.getSprite(6));
		
		entities[4] = new game.entity(0, 0);
		entities[4].setSprite(new renderer.sprite($("#img_planet")[0]));
		
		uiEntities[0] = new game.entity(0, 0);
		uiEntities[0].setSprite(sheet_ui.getSprite(0));
		
		throw "state change";
	}
	
	function updateMenu() {
		handleMenuInput();
		
		updateEntities();
		
		handleMenuPhysics();
	}
	
	function handleMenuInput() {
		if (input.isKeyDown(13) || input.isKeyDown(32)) { // Enter || Space
			switch (stateData.selected) {
			case 0: // New Game
				newGame();
				enterGalaxy();
				break;
			
			case 1: // Continue
				popState();
				break;
			}
		}
		
		if (stateData.selectTimer > 0) {
			stateData.selectTimer--;
		}
		
		if (stateData.selectTimer < 20) {
			if (input.isKeyDown(38) || input.isKeyDown(40)) {
				if (input.isKeyDown(40)) { // DOWN
					stateData.selected++;
					if (stateData.selected > entities.length - 3) {
						stateData.selected = 0;
					}
				}
				if (input.isKeyDown(38)) { // UP
					stateData.selected--;
					if (stateData.selected < 0) {
						stateData.selected = entities.length - 3;
					}
				}
				
				if (stateData.selectTimer == 0) {
					entities[stateData.selected + 2].applyForce(5, 0);
				}
				
				stateData.selectTimer = 30;
			}
		}
	}
	
	function handleMenuPhysics() {
		for (var i = 0; i < entities.length - 2; i++) {
			if (stateData.selected == i) { // wobble
				entities[i + 2].applyGravity([i * 20, 55 + i * 55], 175, 0.2);
			} else { // slide
				entities[i + 2].applyGravity([i * 20, 55 + i * 55], 150, 0.15);
			}
		}
		
		var pos = entities[stateData.selected + 2].getPosition();
		
		entities[1].setPosition(pos[0] - entities[2].getSprite().getWidth() / 2, pos[1]);
	}
	
	function updatePlanet() {
		// handleInput
		
		updateEntities();
		updateCamera();
		
		// handlePhysics
		
		// offscrtracker?
	}
	
	function updateGalaxy() {
		handleGalaxyInput();
		
		updateEntities();
		updateCamera(0.05);
		
		handleGalaxyPhysics();
		
		offscreenTracker(stateData.selected);		
	}
	
	function handleGalaxyInput() {
		if (input.isKeyDown(27)) { // Esc
			pushState();
			enterMenu();
		}
	
		if (input.isKeyDown(87)) { // W
			entities[0].translate(0.2);
			entities[0].setSprite(sheet_ship.getSprite(1));
		} else {
			entities[0].setSprite(sheet_ship.getSprite(0));
		}
		
		if (input.isKeyDown(83)) { // S
			entities[0].translate(-0.05);
		}
		
		if (input.isKeyDown(68)) { // D
			entities[0].rotate(0.075);
		}
		
		if (input.isKeyDown(65)) { // A
			entities[0].rotate(-0.075);
		}
	}
	
	function handleGalaxyPhysics() {
		entities[0].applyGravity([0, 0], 50, 0.2);
		
		var coll_sq = lib.collidePointSphere(entities[0].getPosition(), entities[4].getPosition(), 100);
		if (coll_sq > 0) {
			var x_dist = entities[0].getPosition()[0] - entities[4].getPosition()[0],
				y_dist = entities[0].getPosition()[1] - entities[4].getPosition()[1],
				norm = lib.vecNormalize([x_dist, y_dist]),
				pos = entities[0].getPosition(),
				mom = entities[0].getMomentum(),
				coll = Math.sqrt(coll_sq) / 2;
			
			entities[0].setPosition(
				pos[0] + coll * norm[0],
				pos[1] + coll * norm[1]
			);
		}
		
		for (var i = 0; i < stateData.stars.length; i++) {
			var camPos = camera.getPosition(),
				x_pos = 0,
				y_pos = 0;
				
			if (camPos[0] + i * 600 < 0) {
				x_pos = camPos[0] + ((-camPos[0] - i * 600) / 4) % 800 - 400;
			} else {
				x_pos = camPos[0] + ((-camPos[0] - i * 600) / 4) % 800 + 400;
			}
			
			if (camPos[1] + i * 1450 < 0) {
				y_pos = camPos[1] + ((-camPos[1] - i * 1450) / 4) % 600 - 300;
			} else {
				y_pos = camPos[1] + ((-camPos[1] - i * 1450) / 4) % 600 + 300;
			}
			
			entities[stateData.stars[i]].setPosition(x_pos, y_pos);
		}
	}
	
	function updateEntities() {
		for (var i = 0; i < entities.length; i++) {
			while (!entities[i].alive) {
				if (i == entities.length) {
					entities.pop();
					return;
				}
				
				entities[i] = entities.pop();
			}
			entities[i].tick();
		}
	}
	
	function updateCamera(stiffness) {
		// camera tracking
		var x_diff = entities[0].getPosition()[0] - camera.getPosition()[0],
			y_diff = entities[0].getPosition()[1] - camera.getPosition()[1];
		
		camera.applyForce(x_diff * stiffness, y_diff * stiffness);
		
		camera.tick();
	}
	
	function offscreenTracker(trackedId) {
		var x_diff = entities[trackedId].getPosition()[0] - camera.getPosition()[0],
			y_diff = entities[trackedId].getPosition()[1] - camera.getPosition()[1],
			offscreen = false;
		
		if (x_diff < -390) {
			x_diff = -390;
			offscreen = true;
		} else if (x_diff > 390) {
			x_diff = 390;
			offscreen = true;
		}
		
		if (y_diff < -290) {
			y_diff = -290;
			offscreen = true;
		} else if (y_diff > 290) {
			y_diff = 290;
			offscreen = true;
		}
		
		if (offscreen) {
			uiEntities[0].setPosition(x_diff, y_diff);
			uiEntities[0].setSprite(sheet_ui.getSprite(2));
		} else {
			uiEntities[0].setSprite(sheet_ui.getSprite(0));
		}
	}
	
	
	// Prototype
	game.prototype = {
		constructor: game,
		
		tick: function() {
			try {
				switch (state) {
				case game.enumState.PLANET:
					updatePlanet();
					break;
				
				case game.enumState.GALAXY:
					updateGalaxy();
					break;
				
				default:
					updateMenu();
				}
			} catch (err) {
				if (!(err === "state change")) {
					throw(err);
				}
			}
		},
		
		getState: function() {
			return state;
		},
		
		getCamera: function() {
			return camera;
		},
		
		getEntities: function() {
			return entities;
		},
		
		getUiEntities: function() {
			return uiEntities;
		}
	};
	
	return game;
})();


game.enumState = {
	MENU : 0,
	PLANET : 1,
	GALAXY : 2
}


game.map = function(w, h) {
	var grid = [],
		width = w,
		height = h;
	
	for (var x = 0; x < width; x++) {
		for (var y = 0; y < height; y++) {
			grid[x + y * width] = 0;
		}
	}
	
	// Private Methods
	function xyToGrid(x, y) {
		if (x >= 0 && x < width && y >= 0 && y < height) {
			return (x + y * width);
		}
		
		return -1;
	}
	
	// Public Methods
	this.get = function(x, y) {
		var i = xyToGrid(x, y);
		
		if (i < 0) {
			return 0;
		} else {
			return grid[i];
		}
	}
	
	this.set = function(x, y, val) {
		var i = xyToGrid(x, y);
		
		if (i >= 0) {
			grid[i] = val;
		} else {
			console.log("game.map.set with invalid coords: (" + x + "," + y + ")");
		}
	}
	
	this.getWidth = function() {
		return width;
	}
	
	this.getHeight = function() {
		return height;
	}
};


game.entity = function(x, y) {
	var pos = [x, y],
		rot = 0,
		img = null;
	
	// entities with alive == false will be culled during each tick
	this.alive = true;
	
	this.move = function(x, y) {
		pos[0] += x;
		pos[1] += y;
	}
	
	this.translate = function(val) {
		pos[0] += Math.sin(rot) * val;
		pos[1] -= Math.cos(rot) * val;
	}
	
	this.strafe = function(val) {
		pos[0] += Math.sin(rot + (Math.PI / 2)) * val;
		pos[1] -= Math.cos(rot + (Math.PI / 2)) * val;
	}
	
	this.rotate = function(rad) {
		rot += rad;
		if (rot < 0) {
			rot += 6.28;
		} else if (rot > 6.28) {
			rot -= 6.28;
		}
	}
	
	this.setPosition = function(x, y) {
		pos[0] = x;
		pos[1] = y;
	}
	
	this.setRotation = function(rad) {
		rot = rad % 6.28;
		if (rot < 0)
			rot += 6.28;
	}
	
	this.setSprite = function(sprite) {
		img = sprite;
	}
	
	this.getPosition = function() {
		return pos;
	}
	
	this.getRotation = function() {
		return rot;
	}
	
	this.getSprite = function() {
		return img;
	}
	
	this.tick = function() {}
};

game.physicsEntity = function(x, y, x_mom, y_mom, dissipation, decay) {
	var pos = [x, y],
		ent = new game.entity(x_mom, y_mom);
	
	function applyDecay() {
		/**
		* Decay is applied to limit maximum speed,
		*  increasing in strength proportionate to speed.
		* Dissipation allows the entity to lose all momentum (ie. stop completely),
		*  decreasing in strength proportionate to speed.
		**/
		
		var x_mom = ent.getPosition()[0],
			y_mom = ent.getPosition()[1],
			x_mom_sq = x_mom * x_mom,
			y_mom_sq = y_mom * y_mom;
		
		// apply decay in relation to speed^2, conserve sign
		(x_mom < 0) ? x_mom += (x_mom_sq * decay) : x_mom -= (x_mom_sq * decay);
		(y_mom < 0) ? y_mom += (y_mom_sq * decay) : y_mom -= (y_mom_sq * decay);
		
		if (Math.abs(x_mom) < dissipation && Math.abs(y_mom) < dissipation) {
			x_mom *= 0.5;
			y_mom *= 0.5;
		}
		
		if (Math.abs(x_mom) < (dissipation / 3) && Math.abs(y_mom) < (dissipation / 3)) {
			x_mom = 0;
			y_mom = 0;
		}
		
		ent.setPosition(x_mom, y_mom);
	}
	
	function applyMomentum() {
		pos[0] += ent.getPosition()[0];
		pos[1] += ent.getPosition()[1];
	}
	
	this.applyGravity = function(well, mass, limit) {
		var x_dist = pos[0] - well[0],
			y_dist = pos[1] - well[1],
			sq_dist = x_dist * x_dist + y_dist * y_dist;
		
		// calculate pull
		var pull = ((mass * 500) / (sq_dist + 1)) / 20;
		
		if (pull <= 0)
			return;
		
		if (pull > limit) {
			pull = limit;
		}
		
		var norm = lib.vecNormalize([x_dist, y_dist]);
		
		if (!norm)
			return;
		
		ent.setPosition(
			ent.getPosition()[0] + norm[0] * -pull,
			ent.getPosition()[1] + norm[1] * -pull
		);
	}
	
	this.applyForce = function(x_force, y_force) {
		ent.getPosition()[0] += x_force;
		ent.getPosition()[1] += y_force;
	}
	
	this.getMomentum = function() {
		return ent.getPosition();
	}
	
	this.move = function(x, y) {
		pos[0] += x;
		pos[1] += y;
	}
	
	this.setPosition = function(x, y) {
		pos[0] = x;
		pos[1] = y;
	}
	
	this.getPosition = function() {
		return pos;
	}
	
	this.tick = function() {
		applyMomentum();
		applyDecay();
	}
	
	this.alive = ent.alive;
	
	this.translate = ent.translate;
	this.strafe = ent.strafe;
	this.rotate = ent.rotate;
	
	this.setRotation = ent.setRotation;
	this.setSprite = ent.setSprite;
	
	this.getRotation = ent.getRotation;
	this.getSprite = ent.getSprite;
};
