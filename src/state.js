/**
* = State Module =
*
* State
*  - State.eState
*/


// -- State Module --

State = (function() {
	var current = 0,
		stack = [], // [state, scene]
		callback = {}; // state: [callback, ...]
	
	
	// Constructor
	function _state() {
		current = 0;
		stack = [];
		
		callback.length = State.enum.STATE_COUNT;
		for (var i = 0; i < State.enum.STATE_COUNT; i++) {
			callback[i] = [];
		}
	}
	

	// Prototype
	_state.prototype = {
		constructor: _state,
		
		get: function() {
			return current;
		},
		
		set: function(new_state) {
			if (new_state < 0 || new_state >= callback.length)
				throw "Invalid state change: " + new_state;
			
			current = new_state;
			game.newScene();
			
			if (callback[new_state]) {
				for (var i = 0; i < callback[new_state].length; i++) {
					callback[new_state][i]();
				}
			}
			
			throw "state change";
		},
		
		push: function() {
			stack.push([current, game.getScene()]);
		},
		
		pop: function() {
			if (stack.length == 0)
				return;
			
			var state = stack.pop();
		
			current = state[0];
			game.setScene(state[1]);
		
			throw "state change";
		},
		
		clearStack: function() {
			stack = [];
		},
		
		addCallback: function(state, cb) {
			if (state >= 0 && state < callback.length) {
				callback[state].push(cb);
			}
		}
	};
	
	return _state;
})();


State.enum = {
	MENU : 0,
	PLANET : 1,
	COMBAT : 2,
	GALAXY : 3,
	STATE_COUNT: 4 // "sentry" entry
}
