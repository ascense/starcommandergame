/**
* = Audio Module =
*
* Audio
*  - Audio.sample
*  - Audio.stream
*/


// -- Sound Module --

var Audio = (function() {
	var channel_count = 10,
		channels = [];

	// Constructor
	function _audio() {
		for (var i = 0; i < channel_count; i++) {
			channels[i] = [];
			channels[i][0] = new Audio(); // channel
			channels[i][1] = -1; // buffered audio length
		}
	}
	
	
	function playSample(sample) {
		var time = new Date().getTime();
		
		for (var i = 0; i < cannels.length; i++) {
			if (channels[i][1] < time) { // found empty channel
				channels[i][0] = sample.src;
				channels[i][1] = time + sample.length;
				channels[i][0].load();
				channels[i][0].play();
				break;
			}
		}
	}
	
	
	// Prototype
	_audio.prototype = {
		constructor: _audio,
		
		play: function(sample) {
			playSample(sample);
		},
		
		stop: function() {
			for (var i = 0; i < channels.length; i++) {
				channels[i][0].stop();
				channels[i][1] = -1;
			}
		}
	};
	
	return _audio;
})();


Audio.sample = function(elem) {
	this.src = elem.src;
	this.length = elem.duration * 1000;
}
