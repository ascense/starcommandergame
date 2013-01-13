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
		sheet_galship = null,
		sheet_galplanets = null,
		sheet_fx = null,
		sheet_anim = null,
		sheet_menu = null,
		sheet_ore = null,
		map = null,
		health = 10,
		score = 0;

	// Constructor
	function _game() {
		sprite_title = new View.sprite($("#img_title")[0]);
		sprite_map = new View.sprite($("#img_map")[0]);
		
		sheet_menu = new View.spriteSheet($("#img_menu")[0], 300, 50);
		sheet_ship = new View.spriteSheet($("#img_ship")[0], 50, 100);
		sheet_lander = new View.spriteSheet($("#img_lander")[0], 40, 65);
		sheet_galship = new View.spriteSheet($("#img_galaxyship")[0], 25, 50);
		sheet_galplanets = new View.spriteSheet($("#img_galaxyplanets")[0], 75, 75);
		
		sheet_fx = new View.spriteSheet($("#img_fx")[0], 10, 10);
		sheet_ore = new View.spriteSheet($("#img_ore")[0], 10, 10);
		sheet_anim = new View.spriteSheet($("#img_anim")[0], 25, 25);
		
		for (var i = 0; i < 3; i++) {
			sprite_surface[i] = new View.sprite($("#img_surface_" + i)[0]);
		}
		
		// state callbacks
		state.addCallback(State.enum.MENU, enterMenu);
		state.addCallback(State.enum.PLANET, enterPlanet);
		state.addCallback(State.enum.COMBAT, enterCombat);
		state.addCallback(State.enum.GALAXY, enterGalaxy);
		state.addCallback(State.enum.SCORES, enterScores);
	}
	
	/** MENU **/
	function enterMenu() {
		scene.data.selected = 0;
		scene.data.selectTimer = 0;
		
		scene.camera = new Game.entity(0, 0);
		scene.camera.setRotation(1);
		
		// menu background
		scene.background = sprite_title;
		
		// menu arrow
		scene.uiEntities[0] = new Game.entity(-150, 55, Game.entityType.STATIC);
		scene.uiEntities[0].setSprite(sheet_fx.getSprite(1));
		
		// menu entries
		for (var i = 0; i < 3; i++) {
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
		if (input.isKeyDown(Input.enum.SELECT) || input.isKeyDown(Input.enum.ACTION)) {
			switch (scene.data.selected) {
			case 0: // New Game
				game.newGame();
				state.set(State.enum.GALAXY);
				break;
			
			case 1: // Continue
				state.pop();
				break;
			
			case 2: // Scores
				state.set(State.enum.SCORES);
				break;
			}
		}
		
		if (scene.data.selectTimer > 0) {
			scene.data.selectTimer--;
		}
		
		if (scene.data.selectTimer < 20) {
			if (input.isKeyDown(Input.enum.DOWN) || input.isKeyDown(Input.enum.UP)) {
				if (input.isKeyDown(Input.enum.DOWN)) {
					scene.data.selected++;
					if (scene.data.selected >= scene.entities.length) {
						scene.data.selected = 0;
					}
				}
				if (input.isKeyDown(Input.enum.UP)) {
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
	function enterPlanet(planet) {
		// entity id for player
		scene.data.player = 0;
		
		scene.data.tracker = 2;
		scene.data.burnTimer = 15;
		
		scene.data.transitionFrame = -60;
		
		scene.data.planetId = planet;
		scene.data.inventory = { // ore: amount
			0: 0,
			1: 0,
			2: 0
		};
		
		scene.camera = new Game.physicsEntity(0, 0, 0, 0, 0.25, 0.05);
		scene.camera.setRotation(1);
		
		// background
		scene.background = sprite_surface[map.planets[planet][2]];
		
		scene.entities[0] = new Game.physicsEntity(0, 0, 0, 0, 0.25, 0.075);
		scene.entities[0].setSprite(sheet_lander.getSprite(0));
		
		// minimap
		scene.uiEntities[0] = new Game.entity(567, 507, Game.entityType.STATIC);
		scene.uiEntities[0].setSprite(sprite_map);
		
		scene.uiEntities[1] = new Game.entity(570, 510, Game.entityType.STATIC);
		scene.uiEntities[1].setSprite(view.getMinimap(scene.background));
		
		scene.uiEntities[2] = new Game.entity(281, 257, Game.entityType.STATIC);
		scene.uiEntities[2].setSprite(sheet_fx.getSprite(3));
		
		// obstacles
		for (var i = 0; i < map.planets[scene.data.planetId][4]; i++) {
			scene.entities[i + 1] = new Game.entity(0, 0, Game.entityType.DANGER);
			scene.entities[i + 1].setSprite(sheet_fx.getSprite(0));
			scene.entities[i + 1].origin = [Math.random() * 2400, Math.random() * 900];
			scene.entities[i + 1].offset = 2.5 * i;
		}
		
		// health
		for (var i = 1; i <= 10; i++) {
			scene.uiEntities[i + 2] = new Game.entity(i * 8, 585, Game.entityType.STATIC);
			if (health < i) {
				scene.uiEntities[i + 2].setSprite(sheet_fx.getSprite(10));
			} else {
				scene.uiEntities[i + 2].setSprite(sheet_fx.getSprite(9));
			}
		}
		
		// ores
		scene.data.oreStart = scene.entities.length;
		for (var i = 0; i < map.planets[scene.data.planetId][3]; i++) {
			scene.entities[scene.data.oreStart + i] = new Game.entity(
				Math.random() * 2380 - 1190,
				Math.random() * 880 - 440,
				Game.entityType.ITEM,
				"Ore " + (i % 6)
			);
			scene.entities[scene.data.oreStart + i].setSprite(sheet_ore.getSprite(i % 6));
			
			scene.uiEntities[i + 13] = new Game.entity(
				685 + scene.entities[scene.data.oreStart + i].getPosition()[0] / 10,
				550 + scene.entities[scene.data.oreStart + i].getPosition()[1] / 10
			);
			scene.uiEntities[i + 13].setSprite(sheet_ore.getSprite(i % 3 + 6));
			
			scene.entities[scene.data.oreStart + i].uiLink = scene.uiEntities[i + 13];
		}
	}
	
	function updatePlanet() {
		if (scene.data.transitionFrame < 0) {
			if (scene.data.transitionFrame < -1) {
				scene.data.transitionFrame++;
			}
			
			handlePlanetInput();
			scene.update();
			updateCameraPosition(0.025);
		} else if (scene.data.transitionFrame == 0) {
			state.pop();
		} else {
			scene.data.transitionFrame--;
		}
		
		handlePlanetPhysics();
	}
	
	function handlePlanetInput() {
		if (input.isKeyDown(Input.enum.EXIT)) {
			state.push();
			state.set(State.enum.MENU);
		}
	
		if (input.isKeyDown(Input.enum.FORWARD) || input.isKeyDown(Input.enum.UP)) {
			scene.entities[scene.data.player].translate(0.2);
			scene.entities[scene.data.player].setSprite(sheet_lander.getSprite(1));
		} else {
			scene.entities[scene.data.player].setSprite(sheet_lander.getSprite(0));
		}
		
		if (input.isKeyDown(Input.enum.BACKWARD) || input.isKeyDown(Input.enum.DOWN)) {
			scene.entities[scene.data.player].translate(-0.15);
		}
		
		if (input.isKeyDown(Input.enum.TURN_LT) || input.isKeyDown(Input.enum.LEFT)) {
			scene.entities[scene.data.player].rotate(-0.05);
		}
		
		if (input.isKeyDown(Input.enum.TURN_RT) || input.isKeyDown(Input.enum.RIGHT)) {
			scene.entities[scene.data.player].rotate(0.05);
		}
		
		if (scene.data.burnTimer > 0) {
			scene.data.burnTimer--;
		}
		
		if (input.isKeyDown(Input.enum.BOOST)) {
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
		
		if (input.isKeyDown(Input.enum.ACTION) || input.isKeyDown(Input.enum.SELECT)) {
			scene.data.transitionFrame = 30;
		}
	}
	
	function handlePlanetPhysics() {
		if (scene.data.transitionFrame > 0) {
			scene.camera.setRotation(1 + 2 / 30 * (30 - scene.data.transitionFrame));
			return;
		}
	
		if (scene.camera.getPosition()[1] < -150) {
			scene.camera.setPosition(scene.camera.getPosition()[0], -150);
		} else if (scene.camera.getPosition()[1] > 150) {
			scene.camera.setPosition(scene.camera.getPosition()[0], 150);
		}
		if (scene.camera.getPosition()[0] < -800) {
			scene.camera.setPosition(-800, scene.camera.getPosition()[1]);
		} else if (scene.camera.getPosition()[0] > 800) {
			scene.camera.setPosition(800, scene.camera.getPosition()[1]);
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
		
		// obstacle updates
		for (var i = 1; i < scene.data.oreStart; i++) {
			if (scene.entities[i].getType() != Game.entityType.DANGER)
				continue;
			
			// collide
			if (lib.collidePointSphere(scene.entities[scene.data.player].getPosition(), scene.entities[i].getPosition(), 45) > 0) {
				if (scene.data.transitionFrame == -1) {
					health--;
					scene.data.transitionFrame = -6;
					scene.uiEntities[health + 3].setSprite(sheet_fx.getSprite(10));
				}
			}
			
			// move
			var time = new Date().getTime();
			
			scene.entities[i].setPosition(
				(time / 5 + scene.entities[i].origin[0]) % 2400 - 1200,
				(time / 15 + Math.sin(time / 250 + scene.entities[i].offset) * 50 + scene.entities[i].origin[1]) % 900 - 450
			);
			scene.entities[i].setSprite(sheet_anim.getSprite(Math.floor(time / 100) % 4));
		}
		
		// ore collision
		for (var i = scene.data.oreStart; i < scene.entities.length; i++) {
			if (scene.entities[i].getType() != Game.entityType.ITEM)
				continue;
			
			var coll_sq = lib.collidePointSphere(scene.entities[scene.data.player].getPosition(), scene.entities[i].getPosition(), 45);
			
			if (coll_sq > 0) {
				map.planets[scene.data.planetId][3]--;
				
				scene.entities[i].alive = false;
				if (scene.entities[i].uiLink) {
					scene.entities[i].uiLink.alive = false;
				}
				
				if (!scene.data.inventory[scene.entities[i].getID()]) {
					scene.data.inventory[scene.entities[i].getID()] = 0;
				}
				scene.data.inventory[scene.entities[i].getID()]++;
				score += 1;
			}
		}
	}
	
	/** COMBAT **/
	function enterCombat(planet) {
		// entity id for player
		scene.data.player = 0;
		
		scene.data.selected = 1;
		scene.data.shootTimer = 0;
		scene.data.enemyShootTimer = 0;
		
		scene.camera = new Game.physicsEntity(0, 0, 0, 0, 0.25, 0.05);
		scene.camera.setRotation(1);
	
		scene.entities[0] = new Game.physicsEntity(100, 100, 0, 0, 0.15, 0.001);
		scene.entities[0].setSprite(sheet_ship.getSprite(0));
		
		scene.entities[1] = new Game.physicsEntity(-100, -100, 0, 0, 0.15, 0.001);
		scene.entities[1].setSprite(sheet_ship.getSprite(2));
		scene.entities[1].health = 10;
		
		scene.entities[2] = new Game.entity(0, 0, Game.entityType.PLANET);
		scene.entities[2].setSprite(new View.sprite($("#img_planet")[0]));
		
		scene.uiEntities[0] = new Game.entity(0, 0, Game.entityType.STATIC);
		scene.uiEntities[0].setSprite(sheet_fx.getSprite(0));
		
		// health
		for (var i = 1; i <= 10; i++) {
			scene.uiEntities[i] = new Game.entity(i * 8, 585, Game.entityType.STATIC);
			if (health < i) {
				scene.uiEntities[i].setSprite(sheet_fx.getSprite(10));
			} else {
				scene.uiEntities[i].setSprite(sheet_fx.getSprite(9));
			}
		}
	}
	
	function updateCombat() {
		handleCombatInput();
		
		scene.update();
		updateCameraPosition(0.05);
		updateCameraZoom(scene.data.selected);
		
		handleCombatPhysics();
		
		offscreenTracker(scene.data.selected);
		
		// win condition
		if (scene.entities[1].health <= 0) {
			score += 10;
			state.pop();
		}
	}
	
	function handleCombatInput() {
		if (input.isKeyDown(Input.enum.EXIT)) { // Esc
			state.push();
			state.set(State.enum.MENU);
		}
	
		if (input.isKeyDown(Input.enum.FORWARD) || input.isKeyDown(Input.enum.UP)) { // W || Up
			scene.entities[scene.data.player].translate(0.2);
			scene.entities[scene.data.player].setSprite(sheet_ship.getSprite(1));
		} else {
			scene.entities[scene.data.player].setSprite(sheet_ship.getSprite(0));
		}
		
		if (input.isKeyDown(Input.enum.BACKWARD) || input.isKeyDown(Input.enum.DOWN)) { // S || Down
			scene.entities[scene.data.player].translate(-0.05);
		}
		
		if (input.isKeyDown(Input.enum.TURN_LT) || input.isKeyDown(Input.enum.LEFT)) { // A || Left
			scene.entities[scene.data.player].rotate(-0.075);
		}
		
		if (input.isKeyDown(Input.enum.TURN_RT) || input.isKeyDown(Input.enum.RIGHT)) { // D || Right
			scene.entities[scene.data.player].rotate(0.075);
		}
		
		if (scene.data.shootTimer > 0) {
			scene.data.shootTimer--;
		}
		if (scene.data.enemyShootTimer > 0) {
			scene.data.enemyShootTimer--;
		}
		
		if (input.isKeyDown(Input.enum.ACTION) && scene.data.shootTimer == 0) { // Space
			combatShoot(scene.data.player);
			scene.data.shootTimer = 15;
		}
	}
	
	function handleCombatPhysics() {
		scene.entities[scene.data.player].applyGravity([0, 0], 50, 0.2);
			
		var coll_sq = lib.collidePointSphere(scene.entities[scene.data.player].getPosition(), scene.entities[2].getPosition(), 100);
		if (coll_sq > 0) {
			var x_dist = scene.entities[scene.data.player].getPosition()[0] - scene.entities[2].getPosition()[0],
				y_dist = scene.entities[scene.data.player].getPosition()[1] - scene.entities[2].getPosition()[1],
				norm = lib.vecNormalize([x_dist, y_dist]),
				pos = scene.entities[scene.data.player].getPosition(),
				mom = scene.entities[scene.data.player].getMomentum(),
				coll = Math.sqrt(coll_sq) / 2;
			
			scene.entities[scene.data.player].setPosition(
				pos[0] + coll * norm[0],
				pos[1] + coll * norm[1]
			);
		}
		
		// enemy position
		var offset = [
			scene.entities[1].getPosition()[0] - scene.entities[scene.data.player].getPosition()[0],
			scene.entities[1].getPosition()[1] - scene.entities[scene.data.player].getPosition()[1]
		];
		
		var dot = lib.vecDotProduct(
			[Math.sin(scene.entities[1].getRotation() + Math.PI * 1.5),
			-Math.cos(scene.entities[1].getRotation() + Math.PI * 1.5)],
			lib.vecNormalize(offset)
		);

		if (dot > 0.2) {
			scene.entities[1].rotate(0.075);
		} else if (dot < -0.2) {
			scene.entities[1].rotate(-0.075);
		} else {
			if (offset[0] * offset[0] + offset[1] * offset[1] > 10000) {
				scene.entities[1].translate(0.2);
			} else {
				// (mostly) negative translation, to keep some distance
				scene.entities[1].translate(0.05 - Math.abs(dot));
			}
			
			if (Math.abs(dot) <= 0.15 && scene.data.enemyShootTimer == 0) {
				combatShoot(1);
				scene.data.enemyShootTimer = 15;
			}
		}
		
		// bullet collision
		for (var i = 3; i < scene.entities.length; i++) {
			if (scene.entities[i].getType() != Game.entityType.BULLET)
				continue;
			
			for (var j = 0; j < 3; j++) {
				coll_sq = lib.collidePointSphere(scene.entities[j].getPosition(), scene.entities[i].getPosition(), 50);
				if (coll_sq > 0) {
					scene.entities[i].alive = false;
					if (j == scene.data.player) {
						health--;
						scene.uiEntities[health + 1].setSprite(sheet_fx.getSprite(10));
					} else if (j == 1) {
						scene.entities[1].health--;
					}
				}
			}
		}
	}
	
	function combatShoot(id) {
		var bullet = new Game.physicsEntity(
			Math.sin(scene.entities[id].getRotation()) * 55 + scene.entities[id].getPosition()[0],
			Math.cos(scene.entities[id].getRotation()) * -55 + scene.entities[id].getPosition()[1],
			Math.sin(scene.entities[id].getRotation()) * 12 + scene.entities[id].getMomentum()[0],
			Math.cos(scene.entities[id].getRotation()) * -12 + scene.entities[id].getMomentum()[1],
			0,
			0
		);
		
		bullet.setType(Game.entityType.BULLET);
		bullet.setSprite(sheet_fx.getSprite(8));
		bullet.setTimeToLive(90);
		
		scene.entities.push(bullet);
	}
	
	/** GALAXY **/
	function enterGalaxy() {
		scene.data.player = 0;
		
		scene.data.transitionFrame = -1;
		scene.data.transitionTarget = -1;
	
		scene.camera = new Game.entity(0, 0);
		scene.camera.setRotation(1);
		
		scene.entities[0] = new Game.physicsEntity(100, 100, 0, 0, 0.095, 0.001);
		scene.entities[0].setSprite(sheet_galship.getSprite(0));
		
		for (var i = 0; i < map.planets.length; i++) {
			scene.entities[i + 1] = new Game.entity(map.planets[i][0], map.planets[i][1], Game.entityType.PLANET);
			scene.entities[i + 1].setSprite(sheet_galplanets.getSprite(map.planets[i][2]));
		}
		
		for (var i = 0; i < 2; i++) {
			var ent = new Game.physicsEntity(
				Math.random() * 800 + 400,
				Math.random() * 600 + 300,
				Math.random() * 3 + 1,
				Math.random() * 3 + 1,
				0.0, 0.0
			);
			ent.setSprite(sheet_galship.getSprite(2));
			ent.setRotation(2.5);
			scene.entities.push(ent);
		}
	}
	
	function updateGalaxy() {
		if (scene.data.transitionFrame < 0) {
			handleGalaxyInput();	
			scene.update();
		} else if (scene.data.transitionFrame == 0) {
			// TODO: persistency between planet <-> galaxy
			// transitionTarget
			
			scene.data.transitionFrame = -1;
			scene.camera.setPosition(0, 0);
			
			state.push();
			state.set(State.enum.PLANET, scene.data.target - 1);
		} else {
			scene.data.transitionFrame--;
		}
		
		handleGalaxyPhysics();
	}
	
	function handleGalaxyInput() {
		if (input.isKeyDown(Input.enum.EXIT)) { // Esc
			state.push();
			state.set(State.enum.MENU);
		}
	
		if (input.isKeyDown(Input.enum.FORWARD) || input.isKeyDown(Input.enum.UP)) { // W || Up
			scene.entities[scene.data.player].translate(0.1);
			scene.entities[scene.data.player].setSprite(sheet_galship.getSprite(1));
		} else {
			scene.entities[scene.data.player].setSprite(sheet_galship.getSprite(0));
		}
		
		if (input.isKeyDown(Input.enum.BACKWARD) || input.isKeyDown(Input.enum.DOWN)) { // S || Down
			scene.entities[scene.data.player].translate(-0.05);
		}
		
		if (input.isKeyDown(Input.enum.TURN_LT) || input.isKeyDown(Input.enum.LEFT)) { // A || Left
			scene.entities[scene.data.player].rotate(-0.075);
		}
		
		if (input.isKeyDown(Input.enum.TURN_RT) || input.isKeyDown(Input.enum.RIGHT)) { // D || Right
			scene.entities[scene.data.player].rotate(0.075);
		}
	}
	
	function handleGalaxyPhysics() {
		if (scene.data.transitionFrame >= 0) {
			scene.camera.setRotation(1 / 30 * scene.data.transitionFrame);
			scene.camera.setPosition(
				scene.entities[scene.data.target].getPosition()[0],
				scene.entities[scene.data.target].getPosition()[1]
			);
			
			return;
		}
		
		galaxyWrapAround(scene.data.player);
	
		scene.data.target = 0;
		scene.data.targetDist = -87500; // 300^2 - 50^2
	
		// planetary landing
		for (var i = 1; i < scene.entities.length; i++) {
			if (scene.entities[i].getType() != Game.entityType.PLANET)
				continue;
			
			var coll_sq = lib.collidePointSphere(scene.entities[scene.data.player].getPosition(), scene.entities[i].getPosition(), 50);
			
			if (coll_sq > scene.data.targetDist) {
				scene.data.target = i;
				scene.data.targetDist = coll_sq;
			}
			
			if (coll_sq > 0) {
				scene.entities[scene.data.player].setPosition(
					scene.entities[i].getPosition()[0],
					scene.entities[i].getPosition()[1] - 75
				);
				scene.entities[scene.data.player].setRotation(0);
				
				scene.entities[scene.data.player].applyForce(
					-scene.entities[scene.data.player].getMomentum()[0],
					-scene.entities[scene.data.player].getMomentum()[1]
				);
				scene.entities[scene.data.player].setSprite(sheet_fx.getSprite(0));
				
				scene.data.transitionFrame = 30;
				scene.data.transitionTarget = i;
			}
		}
		
		// update floating enemies
		for (var i = map.planets.length + 1; i < scene.entities.length; i++) {
			galaxyWrapAround(i);
			
			var coll_sq = lib.collidePointSphere(scene.entities[scene.data.player].getPosition(), scene.entities[i].getPosition(), 35);
			
			if (coll_sq > 0) {
				scene.entities[i].setPosition(
					Math.random() * 2400 - 1200,
					-900
				);
				
				var planet = -1;
				if (scene.data.target > 0) {
					planet = map.planets[scene.data.target - 1][2];
				}
				
				state.push();
				state.set(State.enum.COMBAT, planet);
			}
		}
		
		if (scene.data.target > 0) {
			scene.camera.setRotation(1);
			scene.camera.setPosition(
				scene.entities[scene.data.target].getPosition()[0],
				scene.entities[scene.data.target].getPosition()[1]
			);
		} else {
			scene.camera.setRotation(5);
			scene.camera.setPosition(0, 0);
		}
	}
	
	function galaxyWrapAround(id) {
		if (scene.entities[id].getPosition()[0] < -1200) {
			scene.entities[id].setPosition(1200, scene.entities[id].getPosition()[1]);
		} else if (scene.entities[id].getPosition()[0] > 1200) {
			scene.entities[id].setPosition(-1200, scene.entities[id].getPosition()[1]);
		} else if (scene.entities[id].getPosition()[1] < -900) {
			scene.entities[id].setPosition(scene.entities[id].getPosition()[0], 900);
		} else if (scene.entities[id].getPosition()[1] > 900) {
			scene.entities[id].setPosition(scene.entities[id].getPosition()[0], -900);
		}
	}
	
	/** SCORES **/
	function enterScores() {
		scene.data.score = -1;
		scene.data.localScore = score;
	
		scene.camera = new Game.entity(0, 0);
		scene.camera.setRotation(1);
		
		scene.entities[0] = new Game.physicsEntity(60, -150, 5, 0, 0.25, 0.01);
		scene.entities[0].setSprite(sheet_menu.getSprite(2));
		
		if (health <= 0) {
			scene.uiEntities[0] = new Game.entity(285, 75);
			scene.uiEntities[0].setSprite(sheet_menu.getSprite(3));
		}
		
		$.getJSON("http://aqueous-ravine-5531.herokuapp.com/app/games/712/scores", function(data) {
			$.each(data, function(i, item) {
				if (item.score > scene.data.score) {
					scene.data.score = item.score;
				}
			});
			
			if (scene.data.score >= 0 && score > scene.data.score) {
				$.ajax({
					url: "http://aqueous-ravine-5531.herokuapp.com/app/games/712/scores",
					dataType: 'json',
					contentType:'application/json; charset=utf-8',
					type: 'post',
					data: JSON.stringify({score: score})
				});
			}
		});
	}
	
	function updateScores() {
		if (input.isKeyDown(Input.enum.EXIT)
				|| input.isKeyDown(Input.enum.SELECT)
				|| input.isKeyDown(Input.enum.ACTION)) {
			game.newGame();
		}
		
		scene.entities[0].applyGravity([60, -150], 175, 0.2);
		
		scene.update();
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
			dist = Math.sqrt(x_diff * x_diff + y_diff * y_diff) * 0.20;
		
		// slight smoothing
		if (dist > 150) {
			dist -= 0.35 * (dist - 150);
		}
		
		if (dist > 300) {
			dist = 300;
		}
		
		scene.camera.setRotation(1 + dist * 0.01);
	}
	
	function offscreenTracker(trackedId) {
		var scale = 2 / (1 + scene.camera.getRotation()),
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
				state.clearStack();
				state.set(State.enum.MENU);
			} catch (err) {
				if (err != "state change") {
					throw err;
				}
			}
			
			map = new Game.map(6, 7, 6);
			health = 10;
			score = 0;
		},
		
		tick: function() {
			try {
				if (state.get() != State.enum.SCORES && health <= 0) {
					state.set(State.enum.SCORES);
				}
				
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
				
				case State.enum.SCORES:
					updateScores();
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


Game.map = function(numPlanets, avgOres, avgDanger) {
	this.planets = []; // x, y, type, ores, danger
	
	for (var i = 0; i < numPlanets; i++) {
		this.planets[i] = [
			Math.random() * 2250 - 1125,
			i * (1650 / numPlanets) + Math.random() * 150 - 825,
			i % 3,
			Math.floor(Math.random() * avgOres + avgOres / 2),
			Math.floor(Math.random() * avgDanger + avgDanger / 2)
		];
	}
};


Game.entity = function(x, y, _type, id) {
	var pos = [x, y],
		rot = 0,
		img = null,
		type = _type;
	
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
	
	this.setType = function(_type) {
		type = _type;
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
	ITEM: 2, // collectible item
	PLANET: 3, // landable planet
	DANGER: 4, // damaging obstacle
	BULLET: 5 // damaging entity, destroyed on collision
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
	this.setType = ent.setType;
	
	this.getRotation = ent.getRotation;
	this.getSprite = ent.getSprite;
	this.getType = ent.getType;
	this.getID = ent.getID;
};
