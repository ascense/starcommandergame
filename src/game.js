/**
* = Game Module =
*
* game
*  - game.entity
*  - game.map
*/


// -- Game Module --

var game = (function() {
	var camera,
		entities = [],
		ship = null;

	// Constructor
	function game() {
		ship = new renderer.spriteSheet($("#img_ship")[0], 50, 100);
		
		entities[0] = new game.physicsEntity(100, 100, 0, 0, 0.15, 0.001);
		entities[0].setSprite(ship.getSprite(0));
		
		entities[1] = new game.entity(0, 0);
		entities[1].setSprite(new renderer.sprite($("#img_planet")[0]));
		
		camera = new game.physicsEntity(0, -0, 0, 0, 0.25, 0.1);
	}
	
	
	function handleInput() {
		if (input.isKeyDown(87)) { // FW
			entities[0].translate(0.2);
			entities[0].setSprite(ship.getSprite(1));
		} else {
			entities[0].setSprite(ship.getSprite(0));
		}
		
		if (input.isKeyDown(83)) { // BW
			entities[0].translate(-0.05);
		}
		
		if (input.isKeyDown(68)) { // RT
			entities[0].rotate(0.075);
		}
		
		if (input.isKeyDown(65)) { // LT
			entities[0].rotate(-0.075);
		}
		
		if (input.isKeyDown(40)) { // UP
			camera.move(0, 3);
		}
		if (input.isKeyDown(38)) { // DOWN
			camera.move(0, -3);
		}
		if (input.isKeyDown(39)) { // RT
			camera.rotate(0.15);
		}
		if (input.isKeyDown(37)) { // LT
			camera.rotate(-0.15);
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
		
		entities[0].applyGravity([0, 0], 50);
		
		var coll_sq = lib.collidePointSphere(entities[0].getPosition(), entities[1].getPosition(), 100);
		if (coll_sq > 0) {
			var x_dist = entities[0].getPosition()[0] - entities[1].getPosition()[0],
				y_dist = entities[0].getPosition()[1] - entities[1].getPosition()[1],
				norm = lib.vecNormalize([x_dist, y_dist]),
				pos = entities[0].getPosition(),
				mom = entities[0].getMomentum(),
				coll = Math.sqrt(coll_sq) / 2;
			
			entities[0].setPosition(
				pos[0] + coll * norm[0],
				pos[1] + coll * norm[1]
			);
		}
	}
	
	function updateCamera() {
		var x_diff = entities[0].getPosition()[0] - camera.getPosition()[0],
			y_diff = entities[0].getPosition()[1] - camera.getPosition()[1];
		
		camera.applyForce(x_diff * 0.02, y_diff * 0.02);
		
		camera.tick();
	}
	
	
	// Prototype
	game.prototype = {
		constructor: game,
		
		tick: function() {
			handleInput();
			updateEntities();
			updateCamera();
		},
		
		getCamera: function() {
			return camera;
		},
		
		getEntities: function() {
			return entities;
		}
	};
	
	return game;
})();


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
	
	this.applyGravity = function(well, mass) {
		var x_dist = pos[0] - well[0],
			y_dist = pos[1] - well[1],
			sq_dist = x_dist * x_dist + y_dist * y_dist;
		
		// calculate pull
		var pull = ((mass * 500) / (sq_dist + 1)) / 20;
		
		if (pull <= 0)
			return;
		
		if (pull > 0.2) {
			pull = 0.2;
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
