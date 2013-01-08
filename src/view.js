/**
* = View Module =
*
* View
*  - View.sprite
*  - View.spriteSheet
*/


// -- View Module --

var View = (function() {
	var canvas,
		context,
		sheet_stars;

	// Constructor
	function _view(canv) {
		canvas = canv;
		context = canv.getContext("2d");
		
		sheet_stars = new View.spriteSheet($("#img_fx")[0], 10, 10);
	}
	
	function drawBackground(scene) {
		if (!scene.background) {
			drawSpace(scene);
			return;
		}
		
		var cam = scene.camera.getPosition(),
			width = scene.background.getWidth(),
			height = scene.background.getHeight(),
			x_offs = (width - canvas.width) / 2,
			y_offs = (height - canvas.height) / 2,
			x_start = (-cam[0] - x_offs) % width,
			y_start = (-cam[1] - y_offs) % height;
		
		if (x_start > 0) {
			x_start -= width;
		}
		if (y_start > 0) {
			y_start -= height;
		}
		
		for (var x = x_start; x < canvas.width; x += width) {
			for (var y = y_start; y < canvas.height; y += height) {
				drawSprite(scene.background, x, y, width, height);
			}
		}
	}
	
	function drawScene(scene) {
		var ents = scene.entities,
			cam = scene.camera,
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
	}
	
	function drawUI(scene) {
		var ents = scene.uiEntities;
		
		for (var i = 0; i < ents.length; i++) {
			drawUIEntity(ents[i]);
		}
	}
	
	function drawSpace(scene) {
		// clear screen
		context.clearRect(0, 0, canvas.width, canvas.height);
		
		// draw stars
		for (var i = 0; i < 6; i++) {
			var camPos = scene.camera.getPosition(),
				camScale = 1 / (1 + scene.camera.getRotation()),
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
	
	function drawUIEntity(entity) {
		if (entity.getSprite() == null)
			return;
		
		drawSprite(
			entity.getSprite(),
			entity.getPosition()[0],
			entity.getPosition()[1],
			entity.getSprite().getWidth(),
			entity.getSprite().getHeight()
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
	_view.prototype = {
		constructor: _view,
		
		draw: function(scene) {
			drawBackground(scene);
			drawScene(scene);
			drawUI(scene);
		},
		
		getMinimap: function(sprite) {		
			context.drawImage(
				sprite.getImage(),
				0, 0, sprite.getWidth(), sprite.getHeight(),
				0, 0, 240, 90
			);
			
			var minimap = new Image();
			minimap.src = canvas.toDataURL("image/png");
			
			return new View.sprite(minimap, 0, 0, 240, 90);
		}
	};
	
	return _view;
})();


View.sprite = function(image, x, y, width, height) {
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


View.spriteSheet = function(image, sprite_w, sprite_h) {
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
			var x = (i * sprite_w) % width,
				y = Math.floor((i * sprite_w) / width) * sprite_h;
			
			sprites[i] = new View.sprite(image, x, y, sprite_w, sprite_h);
		}
		
		return sprites[i];
	}
};
