/**
* = Input Module =
*
* Input
*  - Input.enum
*/


// -- Input Module --

var Input = (function() {
	var keys = Array();

	// Constructor
	function _input() {
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
	_input.prototype = {
		constructor: _input,
		
		tick: function() {
		},
		
		clear: function() {
			for (var i = 0; i < keys.length; i++) {
				if (keys[i]) {
					keys[i] = false;
				}
			}
		},
		
		isKeyDown: function(key) {
			if (keys[key]) {
				return keys[key];
			}
			
			return false;
		}
	};
	
	return _input;
})();


Input.enum = {
	FORWARD: 87, // W
	BACKWARD: 83, // S
	TURN_LT: 65, // A
	TURN_RT: 68, // D
	UP: 38, // Up
	DOWN: 40, // Down
	LEFT: 37, // Left
	RIGHT: 39, // Right
	BOOST: 16, // Shift
	ACTION: 32, // Space
	SELECT: 13, // Enter
	EXIT: 27 // Esc
}
