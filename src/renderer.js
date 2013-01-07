/**
* = Renderer Module =
*
* renderer
*/


// -- Renderer Module --

var renderer = (function() {
	var canvas,
		context;

	// Constructor
	function renderer(canv) {
		canvas = canv;
		context = canv.getContext("2d");
	}
	
	function drawSpace() {
		// clear screen
		context.clearRect(0, 0, canvas.width, canvas.height);
	}
	
	function drawScene(scene) {
		var ents = scene.getEntities(),
			cam = scene.getCamera();
		
		context.translate(-cam.getPosition()[0], -cam.getPosition()[1]);
		
		for (var i = 0; i < ents.length; i++) {
			// TODO: ota huomioon entityn koko, canvas.w/h * 0.5
			if (ents[i].getPosition()[0] - cam.getPosition()[0] < (-canvas.width * 0.65)
				  || ents[i].getPosition()[0] - cam.getPosition()[0] > (canvas.width * 0.65)
				  || ents[i].getPosition()[1] - cam.getPosition()[1] < (-canvas.height * 0.65)
				  || ents[i].getPosition()[1] - cam.getPosition()[1] > (canvas.height * 0.65)) {
				continue;
			}
			drawEntity(ents[i]);
		}
		
		context.translate(cam.getPosition()[0], cam.getPosition()[1]);
	}
	
	function drawEntity(entity) {
		if (entity.getSprite() == null)
			return;
		
		drawRotated(
			entity.getSprite(),
			entity.getPosition()[0],
			entity.getPosition()[1],
			entity.getRotation()
		);
	}
	
	function drawRotated(sprite, x, y, rot) {
		var center_x = canvas.width / 2,
			center_y = canvas.height / 2,
			img_w = sprite.getWidth(),
			img_h = sprite.getHeight();
		
		// apply rotation
		context.translate(center_x + x, center_y + y);
		context.rotate(rot);
		
		drawSprite(sprite, -img_w / 2, -img_h / 2, img_w, img_h);
		
		// reset rotation
		context.rotate(-rot);
		context.translate(-center_x - x, -center_y - y);
	}
	
	function drawSprite(sprite, x, y, w, h) {
		var arr = sprite.getArray();
		
		context.drawImage(arr[0], arr[1], arr[2], arr[3], arr[4], x, y, w, h);
	}
	
	
	// Prototype
	renderer.prototype = {
		constructor: renderer,
		
		draw: function(scene) {
			drawSpace();
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
