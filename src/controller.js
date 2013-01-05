/**
* = Controller Module =
*/


// -- Controller Module --

var controller = (function() {
	var keys = Array();

	// Constructor
	function controller() {
		// set listeners
		$(document).keyup(keyUp);
		$(document).keydown(keyDown);
	}
	
	// Private Methods
	function keyUp(event) {
		keys[event.which] = false;
	}
	
	function keyDown(event) {
		keys[event.which] = true;
	}
	
	// Prototype
	controller.prototype = {
		constructor: controller,
		
		tick: function() {
		},
		
		isKeyDown: function(key) {
			if (keys[key]) {
				return keys[key];
			}
			
			return false;
		}
	};
	
	return controller;
})();
