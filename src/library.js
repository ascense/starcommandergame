/**
* = Math Function Library =
*/

var lib = {};


// point -> [x, y]; sphere -> [x, y]; radius -> float
lib.collidePointSphere = function(point, sphere, radius) {
	var radius_sq = radius * radius;
	
	return radius_sq - lib.distanceSq(point, sphere);
}

lib.vecDotProduct = function(vec1, vec2) {
	if (vec1.length != vec2.length) {
		console.log("Dot product on vectors of different dimensions!");
		return NaN;
	}

	var dot = 0;
	for (var i = 0; i < vec1.length; i++) {
		dot += vec1[i] * vec2[i];
	}
	
	return dot;
}

lib.vecNormalize = function(vec) {
	var dist = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
	
	if (dist == 0)
		return null;
	
	return [vec[0] / dist, vec[1] / dist];
}

lib.distanceSq = function(vec1, vec2) {
	var x_dist = vec1[0] - vec2[0],
		y_dist = vec1[1] - vec2[1];
	
	return x_dist * x_dist + y_dist * y_dist;
}

// unused
lib.toRadians = function(degrees) {
    return (degrees * Math.PI / 180.0);
}
