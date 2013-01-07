/**
* = Input Module =
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
		
		isKeyDown: function(key) {
			if (keys[key]) {
				return keys[key];
			}
			
			return false;
		}
	};
	
	return _input;
})();
