/**
* = Renderer Module =
*
* renderer
*/


// -- Renderer Module --

var renderer = (function() {
	var canvas,
		context,
		sheet_stars;

	// Constructor
	function renderer(canv) {
		canvas = canv;
		context = canv.getContext("2d");
		
		sheet_stars = new renderer.spriteSheet($("#img_fx")[0], 10, 10);
	}
	
	function drawSpace(scene) {
		// clear screen
		context.clearRect(0, 0, canvas.width, canvas.height);
		
		if (scene.getState() == game.enumState.GALAXY) {
			// draw stars
			for (var i = 0; i < 6; i++) {
				var camPos = scene.getCamera().getPosition(),
					camScale = 1 / (1 + scene.getCamera().getRotation()),
					x_pos = -camPos[0] * (camScale / 4) - (i * i * 221),
					y_pos = -camPos[1] * (camScale / 4) - (i * i * 349);
				
				if (x_pos < 0) {
					x_pos = (x_pos % 800) + 800;
				} else {
					x_pos = (x_pos % 800) - 800;
				}
				
				if (y_pos < 0) {
					y_pos = (y_pos % 600) + 600;
				} else {
					y_pos = (y_pos % 600) - 600;
				}
				
				drawSprite(sheet_stars.getSprite(4 + (i % 3)), x_pos, y_pos, 10, 10);
			}
		}
	}
	
	function drawScene(scene) {
		var ents = scene.getEntities(),
			cam = scene.getCamera(),
			scale = 1 / (1 + cam.getRotation());
		
		context.translate(-cam.getPosition()[0] * scale, -cam.getPosition()[1] * scale);
		
		for (var i = 0; i < ents.length; i++) {
			if ((ents[i].getPosition()[0] - cam.getPosition()[0]) * scale < (-canvas.width - ents[i].getSprite().getWidth()) * 0.5
				  || (ents[i].getPosition()[0] - cam.getPosition()[0]) * scale > (canvas.width + ents[i].getSprite().getWidth()) * 0.5
				  || (ents[i].getPosition()[1] - cam.getPosition()[1]) * scale < (-canvas.height - ents[i].getSprite().getHeight()) * 0.5
				  || (ents[i].getPosition()[1] - cam.getPosition()[1]) * scale > (canvas.height + ents[i].getSprite().getHeight()) * 0.5) {
				continue;
			}
			drawEntity(ents[i], scale);
		}
		
		context.translate(cam.getPosition()[0] * scale, cam.getPosition()[1] * scale);
		
		ents = scene.getUiEntities();
		for (var i = 0; i < ents.length; i++) {
			drawEntity(ents[i], 1);
		}
	}
	
	function drawEntity(entity, scale) {
		if (entity.getSprite() == null)
			return;
		
		drawRotated(
			entity.getSprite(),
			entity.getPosition()[0] * scale,
			entity.getPosition()[1] * scale,
			entity.getRotation(),
			scale
		);
	}
	
	function drawRotated(sprite, x, y, rot, scale) {
		var center_x = canvas.width / 2,
			center_y = canvas.height / 2,
			img_w = sprite.getWidth() * scale,
			img_h = sprite.getHeight() * scale;
		
		if (rot != 0) {
			// apply rotation
			context.translate(center_x + x, center_y + y);
			context.rotate(rot);
			
			drawSprite(sprite, -img_w / 2, -img_h / 2, img_w, img_h);
			
			// reset rotation
			context.rotate(-rot);
			context.translate(-center_x - x, -center_y - y);
		} else {
			drawSprite(sprite, center_x + x - img_w / 2, center_y + y - img_h / 2, img_w, img_h);
		}
	}
	
	function drawSprite(sprite, x, y, w, h) {
		var arr = sprite.getArray();
		
		context.drawImage(arr[0], arr[1], arr[2], arr[3], arr[4], x, y, w, h);
	}
	
	
	// Prototype
	renderer.prototype = {
		constructor: renderer,
		
		draw: function(scene) {
			drawSpace(scene);
			drawScene(scene);
			// drawUI();
		}
	};
	
	return renderer;
})();


renderer.sprite = function(image, x, y, width, height) {
	var pos = [x, y];
	
	if (x == null || y == null) {
		pos = [0, 0];
		width = image.width;
		height = image.height;
	}
	
	this.setPosition = function(x, y) {
		pos[0] = x;
		pos[1] = y;
	}
	
	this.getPosition = function() {
		return pos;
	}
	
	this.getWidth = function() {
		return width;
	}
	
	this.getHeight = function() {
		return height;
	}
	
	this.getImage = function() {
		return image;
	}
	
	this.getArray = function() {
		return [image, pos[0], pos[1], width, height];
	}
}


renderer.spriteSheet = function(image, sprite_w, sprite_h) {
	var img = image,
		width = image.width,
		height = image.height,
		sprites = [];
	
	sprites.length = width / sprite_w * (height / sprite_h);
	
	this.length = function() {
		return sprites.length;
	}
	
	this.getSprite = function(i) {
		if (i >= sprites.length)
			return null;
		
		if (!sprites[i]) {
			var x = i % (width / sprite_w),
				y = Math.floor(i / (width / sprite_w));
			
			sprites[i] = new renderer.sprite(image, x * sprite_w, y * sprite_h, sprite_w, sprite_h);
		}
		
		return sprites[i];
	}
};
