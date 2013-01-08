/**
* = Game Module =
*
* game
*  - game.entity
*  - game.physicsEntity
*  - game.map
*/


// -- Game Module --

Game = (function() {
	var scene = null,
		sprite_title = null,
		sheet_ship = null,
		sheet_fx = null,
		sheet_menu = null;

	// Constructor
	function _game() {
		sprite_title = new View.sprite($("#img_title")[0]);
		
		sheet_menu = new View.spriteSheet($("#img_menu")[0], 300, 50);
		sheet_fx = new View.spriteSheet($("#img_fx")[0], 10, 10);
		sheet_ship = new View.spriteSheet($("#img_ship")[0], 50, 100);
		
		// state callbacks
		state.addCallback(State.enum.MENU, enterMenu);
		state.addCallback(State.enum.PLANET, enterPlanet);
		state.addCallback(State.enum.COMBAT, enterCombat);
		state.addCallback(State.enum.GALAXY, enterGalaxy);
	}
	
	/** MENU **/
	function enterMenu() {
		scene.data.selected = 0;
		scene.data.selectTimer = 0;
		
		scene.camera = new Game.entity(0, 0);
		
		// menu background
		scene.entities[0] = new Game.entity(0, 0);
		scene.entities[0].setSprite(sprite_title);
		
		// menu arrow
		scene.entities[1] = new Game.entity(-150, 55);
		scene.entities[1].setSprite(sheet_fx.getSprite(1));
		scene.entities[1].rotate(Math.PI / 2);
		
		// menu entries
		for (var i = 0; i < sheet_menu.length(); i++) {
			scene.entities[i + 2] = new Game.physicsEntity(-150 + i * 25, 55 + i * 55, 5, 0, 0.25, 0.01);
			scene.entities[i + 2].setSprite(sheet_menu.getSprite(i));
		}
	}
	
	function updateMenu() {
		handleMenuInput();
		
		scene.update();
		
		handleMenuPhysics();
	}
	
	function handleMenuInput() {
		if (input.isKeyDown(13) || input.isKeyDown(32)) { // Enter || Space
			switch (scene.data.selected) {
			case 0: // New Game
				state.clearStack();
				state.set(State.enum.COMBAT);
				break;
			
			case 1: // Continue
				state.pop();
				break;
			}
		}
		
		if (scene.data.selectTimer > 0) {
			scene.data.selectTimer--;
		}
		
		if (scene.data.selectTimer < 20) {
			if (input.isKeyDown(38) || input.isKeyDown(40)) {
				if (input.isKeyDown(40)) { // DOWN
					scene.data.selected++;
					if (scene.data.selected > scene.entities.length - 3) {
						scene.data.selected = 0;
					}
				}
				if (input.isKeyDown(38)) { // UP
					scene.data.selected--;
					if (scene.data.selected < 0) {
						scene.data.selected = scene.entities.length - 3;
					}
				}
				
				if (scene.data.selectTimer == 0) {
					scene.entities[scene.data.selected + 2].applyForce(5, 0);
				}
				
				scene.data.selectTimer = 30;
			}
		}
	}
	
	function handleMenuPhysics() {
		for (var i = 0; i < scene.entities.length - 2; i++) {
			if (scene.data.selected == i) { // wobble
				scene.entities[i + 2].applyGravity([i * 20, 55 + i * 55], 175, 0.2);
			} else { // slide
				scene.entities[i + 2].applyGravity([i * 20, 55 + i * 55], 150, 0.15);
			}
		}
		
		var pos = scene.entities[scene.data.selected + 2].getPosition();
		
		scene.entities[1].setPosition(pos[0] - scene.entities[2].getSprite().getWidth() / 2, pos[1]);
	}
	
	/** PLANET **/
	function enterPlanet() {
		scene.camera = new Game.physicsEntity(0, 0, 0, 0, 0.25, 0.1);
	}
	
	function updatePlanet() {
		// handleInput
		
		scene.update();
		updateCamera();
		
		// handlePhysics
		
		// offscrtracker?
	}
	
	/** COMBAT **/
	function enterCombat() {
		scene.data.selected = 1;
		scene.data.shootTimer = 0;
		
		scene.camera = new Game.physicsEntity(0, 0, 0, 0, 0.25, 0.05);
	
		scene.entities[0] = new Game.physicsEntity(100, 100, 0, 0, 0.15, 0.001);
		scene.entities[0].setSprite(sheet_ship.getSprite(0));
		
		scene.entities[1] = new Game.entity(0, 0);
		scene.entities[1].setSprite(new View.sprite($("#img_planet")[0]));
		
		scene.uiEntities[0] = new Game.entity(0, 0);
		scene.uiEntities[0].setSprite(sheet_fx.getSprite(0));
	}
	
	function updateCombat() {
		handleCombatInput();
		
		scene.update();
		updateCamera(0.05);
		
		handleCombatPhysics();
		
		offscreenTracker(scene.data.selected);		
	}
	
	function handleCombatInput() {
		if (input.isKeyDown(27)) { // Esc
			state.push();
			state.set(State.enum.MENU);
		}
	
		if (input.isKeyDown(87)) { // W
			scene.entities[0].translate(0.2);
			scene.entities[0].setSprite(sheet_ship.getSprite(1));
		} else {
			scene.entities[0].setSprite(sheet_ship.getSprite(0));
		}
		
		if (input.isKeyDown(83)) { // S
			scene.entities[0].translate(-0.05);
		}
		
		if (input.isKeyDown(68)) { // D
			scene.entities[0].rotate(0.075);
		}
		
		if (input.isKeyDown(65)) { // A
			scene.entities[0].rotate(-0.075);
		}
		
		if (scene.data.shootTimer > 0) {
			scene.data.shootTimer--;
		}
		
		if (input.isKeyDown(32) && scene.data.shootTimer == 0) { // Space
			var bullet = new Game.physicsEntity(
				scene.entities[0].getPosition()[0],
				scene.entities[0].getPosition()[1],
				Math.sin(scene.entities[0].getRotation()) * 7.5 + scene.entities[0].getMomentum()[0],
				Math.cos(scene.entities[0].getRotation()) * -7.5 + scene.entities[0].getMomentum()[1],
				0,
				0
			);
			
			bullet.setSprite(sheet_fx.getSprite(3));
			bullet.setTimeToLive(90);
			
			scene.data.shootTimer = 15;
			scene.entities.push(bullet);
		}
	}
	
	function handleCombatPhysics() {
		scene.entities[0].applyGravity([0, 0], 50, 0.2);
		
		var coll_sq = lib.collidePointSphere(scene.entities[0].getPosition(), scene.entities[1].getPosition(), 100);
		if (coll_sq > 0) {
			var x_dist = scene.entities[0].getPosition()[0] - scene.entities[1].getPosition()[0],
				y_dist = scene.entities[0].getPosition()[1] - scene.entities[1].getPosition()[1],
				norm = lib.vecNormalize([x_dist, y_dist]),
				pos = scene.entities[0].getPosition(),
				mom = scene.entities[0].getMomentum(),
				coll = Math.sqrt(coll_sq) / 2;
			
			scene.entities[0].setPosition(
				pos[0] + coll * norm[0],
				pos[1] + coll * norm[1]
			);
		}
	}
	
	/** GALAXY **/
	function enterGalaxy() {
		scene.camera = new Game.physicsEntity(0, 0, 0, 0, 0.25, 0.05);
		
		scene.entities[0] = new Game.physicsEntity(100, 100, 0, 0, 0.15, 0.001);
		scene.entities[0].setSprite(sheet_ship.getSprite(0));
	}
	
	function updateGalaxy() {
		// handleInput
		
		scene.update();
		updateCamera();
		
		// handlePhysics
	}
	
	/** Helper Functions **/
	function updateCamera(stiffness) {
		// camera tracking
		var x_diff = scene.entities[0].getPosition()[0] - scene.camera.getPosition()[0],
			y_diff = scene.entities[0].getPosition()[1] - scene.camera.getPosition()[1];
		
		scene.camera.applyForce(x_diff * stiffness, y_diff * stiffness);
		
		scene.camera.tick();
		
		// camera zoom
		x_diff = scene.entities[scene.data.selected].getPosition()[0] - scene.camera.getPosition()[0];
		y_diff = scene.entities[scene.data.selected].getPosition()[1] - scene.camera.getPosition()[1];
		
		var dist = Math.sqrt(x_diff * x_diff + y_diff * y_diff) * 0.15;
		
		if (dist > 200) {
			dist = 200;
		}
		
		scene.camera.setRotation(dist * 0.01);
	}
	
	function offscreenTracker(trackedId) {
		var scale = 1 / (1 + scene.camera.getRotation()),
			x_diff = (scene.entities[trackedId].getPosition()[0] - scene.camera.getPosition()[0]) * scale,
			y_diff = (scene.entities[trackedId].getPosition()[1] - scene.camera.getPosition()[1]) * scale,
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
			scene.uiEntities[0].setPosition(x_diff, y_diff);
			scene.uiEntities[0].setSprite(sheet_fx.getSprite(2));
		} else {
			scene.uiEntities[0].setSprite(sheet_fx.getSprite(0));
		}
	}
	
	
	// Prototype
	_game.prototype = {
		constructor: _game,
	
		newGame: function() {
			try {
				state.set(State.enum.MENU);
			} catch (err) {
				if (err != "state change")
					throw(err);
			}
		},
		
		tick: function() {
			try {
				switch (state.get()) {
				case State.enum.MENU:
					updateMenu();
					break;
				
				case State.enum.PLANET:
					updatePlanet();
					break;
				
				case State.enum.COMBAT:
					updateCombat();
					break;
				
				case State.enum.GALAXY:
					updateGalaxy();
					break;
				
				default:
					throw "Invalid state: " + state.get();
				}
			} catch (err) {
				if (!(err === "state change")) {
					throw(err);
				}
			}
		},
		
		newScene: function() {
			scene = new Game.scene();
		},
		
		setScene: function(new_scene) {
			scene = new_scene;
		},
		
		getScene: function() {
			return scene;
		}
	};
	
	return _game;
})();


Game.scene = function() {
	this.camera = null;
	this.entities = [];
	this.uiEntities = [];
	this.data = {};
	
	// Public Methods
	this.update = function() {
		for (var i = 0; i < this.entities.length; i++) {
			while (!this.entities[i].alive) {
				if (i == this.entities.length - 1) {
					this.entities.pop();
					return;
				}
				
				this.entities[i] = this.entities.pop();
			}
			
			this.entities[i].tick();
		}
	}
}


Game.map = function(w, h) {
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


Game.entity = function(x, y) {
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

Game.physicsEntity = function(x, y, x_mom, y_mom, dissipation, decay) {
	var pos = [x, y],
		ent = new Game.entity(x_mom, y_mom),
		ttl = -1; // time-to-live timer
	
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
	
	this.setTimeToLive = function(_ttl) {
		ttl = _ttl; // how many game ticks (60th's of a sec) to live
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
		
		if (ttl > 0) {
			ttl--;
		} else if (ttl == 0) {
			this.alive = false;
		}
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
