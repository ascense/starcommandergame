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
		sprite_map = null,
		sprite_surface = [],
		sheet_ship = null,
		sheet_lander = null,
		sheet_fx = null,
		sheet_menu = null,
		sheet_ore = null;

	// Constructor
	function _game() {
		sprite_title = new View.sprite($("#img_title")[0]);
		sprite_map = new View.sprite($("#img_map")[0]);
		
		sheet_menu = new View.spriteSheet($("#img_menu")[0], 300, 50);
		sheet_ship = new View.spriteSheet($("#img_ship")[0], 50, 100);
		sheet_lander = new View.spriteSheet($("#img_lander")[0], 40, 65);
		
		sheet_fx = new View.spriteSheet($("#img_fx")[0], 10, 10);
		sheet_ore = new View.spriteSheet($("#img_ore")[0], 10, 10);
		
		sprite_surface[0] = new View.sprite($("#img_surface_0")[0]);
		
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
		scene.background = sprite_title;
		
		// menu arrow
		scene.uiEntities[0] = new Game.entity(-150, 55, Game.entityType.STATIC);
		scene.uiEntities[0].setSprite(sheet_fx.getSprite(1));
		
		// menu entries
		for (var i = 0; i < sheet_menu.length(); i++) {
			scene.entities[i] = new Game.physicsEntity(-150 + i * 25, 55 + i * 55, 5, 0, 0.25, 0.01);
			scene.entities[i].setSprite(sheet_menu.getSprite(i));
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
				state.set(State.enum.PLANET);
				break;
			
			case 1: // Continue
				state.pop();
				break;
			
			case 2: // Scores ## Combat for testing purposes ##
				state.clearStack();
				state.set(State.enum.COMBAT);
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
					if (scene.data.selected >= scene.entities.length) {
						scene.data.selected = 0;
					}
				}
				if (input.isKeyDown(38)) { // UP
					scene.data.selected--;
					if (scene.data.selected < 0) {
						scene.data.selected = scene.entities.length - 1;
					}
				}
				
				if (scene.data.selectTimer == 0) {
					scene.entities[scene.data.selected].applyForce(5, 0);
				}
				
				scene.data.selectTimer = 30;
			}
		}
	}
	
	function handleMenuPhysics() {
		for (var i = 0; i < scene.entities.length; i++) {
			if (scene.data.selected == i) { // wobble
				scene.entities[i].applyGravity([i * 20, 55 + i * 55], 175, 0.2);
			} else { // slide
				scene.entities[i].applyGravity([i * 20, 55 + i * 55], 150, 0.15);
			}
		}
		
		var pos = scene.entities[scene.data.selected].getPosition();
		
		scene.uiEntities[0].setPosition(395 + pos[0] - scene.entities[0].getSprite().getWidth() / 2, 295 + pos[1]);
	}
	
	/** PLANET **/
	function enterPlanet() {
		// entity id for player
		scene.data.player = 0;
		
		scene.data.tracker = 2;
		scene.data.burnTimer = 15;
		
		scene.data.inventory = { // ore: amount
			0: 0,
			1: 0,
			2: 0
		};
		
		scene.camera = new Game.physicsEntity(0, 0, 0, 0, 0.25, 0.05);
		
		// background
		scene.background = sprite_surface[0];
		
		scene.entities[0] = new Game.physicsEntity(100, 100, 0, 0, 0.25, 0.075);
		scene.entities[0].setSprite(sheet_lander.getSprite(0));
		
		// minimap
		scene.uiEntities[0] = new Game.entity(567, 507, Game.entityType.STATIC);
		scene.uiEntities[0].setSprite(sprite_map);
		
		scene.uiEntities[1] = new Game.entity(570, 510, Game.entityType.STATIC);
		scene.uiEntities[1].setSprite(view.getMinimap(sprite_surface[0]));
		
		scene.uiEntities[2] = new Game.entity(281, 257, Game.entityType.STATIC);
		scene.uiEntities[2].setSprite(sheet_fx.getSprite(3));
		
		// ores
		for (var i = 0; i < 12; i++) {
			scene.entities[i + 1] = new Game.entity(Math.random() * 2380 - 1190, Math.random() * 880 - 440, Game.entityType.ITEM, "Ore " + (i % 6));
			scene.entities[i + 1].setSprite(sheet_ore.getSprite(i % 6));
			
			scene.uiEntities[i + 3] = new Game.entity(
				685 + scene.entities[i + 1].getPosition()[0] / 10,
				550 + scene.entities[i + 1].getPosition()[1] / 10
			);
			scene.uiEntities[i + 3].setSprite(sheet_ore.getSprite(i % 3 + 6));
			
			scene.entities[i + 1].uiLink = scene.uiEntities[i + 3];
		}
	}
	
	function updatePlanet() {
		handlePlanetInput();
		
		scene.update();
		updateCameraPosition(0.025);
		
		handlePlanetPhysics();
	}
	
	function handlePlanetInput() {
		if (input.isKeyDown(27)) { // Esc
			state.push();
			state.set(State.enum.MENU);
		}
	
		if (input.isKeyDown(87) || input.isKeyDown(38)) { // W || Up
			scene.entities[scene.data.player].translate(0.2);
			scene.entities[scene.data.player].setSprite(sheet_lander.getSprite(1));
		} else {
			scene.entities[scene.data.player].setSprite(sheet_lander.getSprite(0));
		}
		
		if (input.isKeyDown(83) || input.isKeyDown(40)) { // S || Down
			scene.entities[scene.data.player].translate(-0.15);
		}
		
		if (input.isKeyDown(65) || input.isKeyDown(37)) { // A || Left
			scene.entities[scene.data.player].rotate(-0.05);
		}
		
		if (input.isKeyDown(68) || input.isKeyDown(39)) { // D || Right
			scene.entities[scene.data.player].rotate(0.05);
		}
		
		if (scene.data.burnTimer > 0) {
			scene.data.burnTimer--;
		}
		
		if (input.isKeyDown(32)) { // Space
			if (scene.data.burnTimer == 0) {
				scene.data.burnTimer = 300;
			} else if (scene.data.burnTimer > 255) {
				scene.entities[scene.data.player].translate(1.5);
			
				// particle fx
				var smoke = new Game.physicsEntity(
					scene.entities[scene.data.player].getPosition()[0],
					scene.entities[scene.data.player].getPosition()[1],
					Math.sin(scene.entities[scene.data.player].getRotation()) * -5
					 + scene.entities[scene.data.player].getMomentum()[0] + Math.random() * 3 - 1.5,
					Math.cos(scene.entities[scene.data.player].getRotation()) * 5
					 + scene.entities[scene.data.player].getMomentum()[1] + Math.random() * 3 - 1.5,
					0,
					0
				);
				
				smoke.setSprite(sheet_fx.getSprite(4));
				smoke.setTimeToLive(20);
				
				scene.entities.push(smoke);
			}
		}
	}
	
	function handlePlanetPhysics() {
		if (scene.camera.getPosition()[1] < -150) {
			scene.camera.setPosition(scene.camera.getPosition()[0], -150);
		} else if (scene.camera.getPosition()[1] > 150) {
			scene.camera.setPosition(scene.camera.getPosition()[0], 150);
		}
		
		if (scene.entities[scene.data.player].getPosition()[1] < -425) {
			scene.entities[scene.data.player].setPosition(
				scene.entities[scene.data.player].getPosition()[0],
				-425
			);
		} else if (scene.entities[scene.data.player].getPosition()[1] > 425) {
			scene.entities[scene.data.player].setPosition(
				scene.entities[scene.data.player].getPosition()[0],
				425
			);
		}
		
		if (scene.entities[scene.data.player].getPosition()[0] < -1200) {
			scene.entities[scene.data.player].setPosition(
				scene.entities[scene.data.player].getPosition()[0] + 2400,
				scene.entities[scene.data.player].getPosition()[1]
			);
			scene.camera.setPosition(
				scene.camera.getPosition()[0] + 2400,
				scene.camera.getPosition()[1]
			);
		} else if (scene.entities[scene.data.player].getPosition()[0] > 1200) {
			scene.entities[scene.data.player].setPosition(
				scene.entities[scene.data.player].getPosition()[0] - 2400,
				scene.entities[scene.data.player].getPosition()[1]
			);
			scene.camera.setPosition(
				scene.camera.getPosition()[0] - 2400,
				scene.camera.getPosition()[1]
			);
		}
		
		// minimap
		scene.uiEntities[scene.data.tracker].setPosition(
			685 + scene.entities[scene.data.player].getPosition()[0] / 10,
			550 + scene.entities[scene.data.player].getPosition()[1] / 10
		);
		
		// ore collision
		for (var i = 1; i < scene.entities.length; i++) {
			if (scene.entities[i].getType() != Game.entityType.ITEM)
				continue;
			
			var coll_sq = lib.collidePointSphere(scene.entities[scene.data.player].getPosition(), scene.entities[i].getPosition(), 45);
			
			if (coll_sq > 0) {
				scene.entities[i].alive = false;
				if (scene.entities[i].uiLink) {
					scene.entities[i].uiLink.alive = false;
				}
				
				if (!scene.data.inventory[scene.entities[i].getID()]) {
					scene.data.inventory[scene.entities[i].getID()] = 0;
				}
				scene.data.inventory[scene.entities[i].getID()]++;
			}
		}
	}
	
	/** COMBAT **/
	function enterCombat() {
		// entity id for player
		scene.data.player = 0;
		
		scene.data.selected = 1;
		scene.data.shootTimer = 0;
		
		scene.camera = new Game.physicsEntity(0, 0, 0, 0, 0.25, 0.05);
	
		scene.entities[0] = new Game.physicsEntity(100, 100, 0, 0, 0.15, 0.001);
		scene.entities[0].setSprite(sheet_ship.getSprite(0));
		
		scene.entities[1] = new Game.entity(0, 0, Game.entityType.STATIC);
		scene.entities[1].setSprite(new View.sprite($("#img_planet")[0]));
		
		scene.uiEntities[0] = new Game.entity(0, 0, Game.entityType.STATIC);
		scene.uiEntities[0].setSprite(sheet_fx.getSprite(0));
	}
	
	function updateCombat() {
		handleCombatInput();
		
		scene.update();
		updateCameraPosition(0.05);
		updateCameraZoom(scene.data.selected);
		
		handleCombatPhysics();
		
		offscreenTracker(scene.data.selected);		
	}
	
	function handleCombatInput() {
		if (input.isKeyDown(27)) { // Esc
			state.push();
			state.set(State.enum.MENU);
		}
	
		if (input.isKeyDown(87) || input.isKeyDown(38)) { // W || Up
			scene.entities[scene.data.player].translate(0.2);
			scene.entities[scene.data.player].setSprite(sheet_ship.getSprite(1));
		} else {
			scene.entities[scene.data.player].setSprite(sheet_ship.getSprite(0));
		}
		
		if (input.isKeyDown(83) || input.isKeyDown(40)) { // S || Down
			scene.entities[scene.data.player].translate(-0.05);
		}
		
		if (input.isKeyDown(65) || input.isKeyDown(37)) { // A || Left
			scene.entities[scene.data.player].rotate(-0.075);
		}
		
		if (input.isKeyDown(68) || input.isKeyDown(39)) { // D || Right
			scene.entities[scene.data.player].rotate(0.075);
		}
		
		if (scene.data.shootTimer > 0) {
			scene.data.shootTimer--;
		}
		
		if (input.isKeyDown(32) && scene.data.shootTimer == 0) { // Space
			var bullet = new Game.physicsEntity(
				scene.entities[scene.data.player].getPosition()[0],
				scene.entities[scene.data.player].getPosition()[1],
				Math.sin(scene.entities[scene.data.player].getRotation()) * 7.5 + scene.entities[scene.data.player].getMomentum()[0],
				Math.cos(scene.entities[scene.data.player].getRotation()) * -7.5 + scene.entities[scene.data.player].getMomentum()[1],
				0,
				0
			);
			
			bullet.setSprite(sheet_fx.getSprite(8));
			bullet.setTimeToLive(90);
			
			scene.data.shootTimer = 15;
			scene.entities.push(bullet);
		}
	}
	
	function handleCombatPhysics() {
		scene.entities[scene.data.player].applyGravity([0, 0], 50, 0.2);
		
		var coll_sq = lib.collidePointSphere(scene.entities[scene.data.player].getPosition(), scene.entities[1].getPosition(), 100);
		if (coll_sq > 0) {
			var x_dist = scene.entities[scene.data.player].getPosition()[0] - scene.entities[1].getPosition()[0],
				y_dist = scene.entities[scene.data.player].getPosition()[1] - scene.entities[1].getPosition()[1],
				norm = lib.vecNormalize([x_dist, y_dist]),
				pos = scene.entities[scene.data.player].getPosition(),
				mom = scene.entities[scene.data.player].getMomentum(),
				coll = Math.sqrt(coll_sq) / 2;
			
			scene.entities[scene.data.player].setPosition(
				pos[0] + coll * norm[0],
				pos[1] + coll * norm[1]
			);
		}
	}
	
	/** GALAXY **/
	function enterGalaxy() {
		scene.data.player = 0;
	
		scene.camera = new Game.physicsEntity(0, 0, 0, 0, 0.25, 0.05);
		
		scene.entities[0] = new Game.physicsEntity(100, 100, 0, 0, 0.15, 0.001);
		scene.entities[0].setSprite(sheet_ship.getSprite(0));
	}
	
	function updateGalaxy() {
		// handleInput
		
		scene.update();
		updateCameraPosition();
		
		// handlePhysics
	}
	
	/** Helper Functions **/
	function updateCameraPosition(stiffness) {
		var x_diff = scene.entities[scene.data.player].getPosition()[0] - scene.camera.getPosition()[0],
			y_diff = scene.entities[scene.data.player].getPosition()[1] - scene.camera.getPosition()[1];
		
		scene.camera.applyForce(x_diff * stiffness, y_diff * stiffness);
		
		scene.camera.tick();
	}
	
	function updateCameraZoom(trackedId) {
		var x_diff = scene.entities[trackedId].getPosition()[0] - scene.camera.getPosition()[0],
			y_diff = scene.entities[trackedId].getPosition()[1] - scene.camera.getPosition()[1],
			dist = Math.sqrt(x_diff * x_diff + y_diff * y_diff) * 0.15;
		
		// slight smoothing
		if (dist > 100) {
			dist -= 0.35 * (dist - 100);
		}
		
		if (dist > 200) {
			dist = 200;
		}
		
		scene.camera.setRotation(dist * 0.01);
	}
	
	function offscreenTracker(trackedId) {
		var scale = 1 / (1 + scene.camera.getRotation()),
			x_diff = (scene.entities[trackedId].getPosition()[0] - scene.camera.getPosition()[0]) * scale + 400,
			y_diff = (scene.entities[trackedId].getPosition()[1] - scene.camera.getPosition()[1]) * scale + 300,
			offscreen = false;
		
		if (x_diff < 0) {
			x_diff = 5;
			offscreen = true;
		} else if (x_diff > 800) {
			x_diff = 785;
			offscreen = true;
		}
		
		if (y_diff < 0) {
			y_diff = 5;
			offscreen = true;
		} else if (y_diff > 600) {
			y_diff = 585;
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
				if (err != "state change") {
					throw err;
				}
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
					throw err;
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
	this.background = null;
	this.data = {};
	
	function cullEntities(ents) {
		for (var i = 0; i < ents.length; i++) {
			if (!ents[i].getType)
				continue;
			
			while (!ents[i].alive) {
				if (i == ents.length - 1) {
					ents.pop();
					return;
				}
				
				ents[i] = ents.pop();
			}
			
			ents[i].tick();
		}
	}
	
	// Public Methods
	this.update = function() {
		cullEntities(this.entities);
		cullEntities(this.uiEntities);
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


Game.entity = function(x, y, type, id) {
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
	
	this.getType = function() {
		return type;
	}
	
	this.getID = function() {
		return id;
	}
	
	this.tick = function() {}
};

Game.entityType = {
	NULL: 0, // normal entity
	STATIC: 1,// no updates
	ITEM: 2 // collectible item
};


Game.physicsEntity = function(x, y, x_mom, y_mom, dissipation, decay) {
	var pos = [x, y],
		ent = new Game.entity(x_mom, y_mom, 0),
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
	this.getType = ent.getType;
	this.getID = ent.getID;
};
