/**
* = Procedural Content Generation Algorithms =
*/


// Generate new distinct colors using the golden ratio
function colorGenerator() {
	var golden_ratio = 0.618033988749895;
	var h = Math.random();

	this.getNext = function() {
		h += golden_ratio;
		h %= 1;
		return this.hsvToRgb(h, 0.5, 0.95);
	}
}

// Convert float3 HSV color values into float3 RGB values
colorGenerator.prototype.hsvToRgb = function(h, s, v) {
	var h_i = Math.floor(h*6);
	var f = h*6 - h_i;
	var p = v * (1 - s);
	var q = v * (1 - f*s);
	var t = v * (1 - (1 - f) * s);

	var r, g, b;
	switch (h_i) {
	case 0:
		r = v;
		g = t;
		b = p;
		break;
	case 1:
		r = q;
		g = v;
		b = p;
		break;
	case 2:
		r = p;
		g = v;
		b = t;
		break;
	case 3:
		r = p;
		g = q; 
		b = v;
		break;
	case 4:
		r = t;
		g = p;
		b = v;
		break;
	case 5:
		r = v;
		g = p;
		b = q;
		break;
	}

	return [r, g, b];
}
