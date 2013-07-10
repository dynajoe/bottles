module.exports.round = round = function (x, places) {
   var m = (10 * (places || 0) || 1);

   return Math.round(m * x) / m;
};

module.exports.random = random = function (seed) {
   return Math.random();
};

module.exports.randomAngle = randomAngle = function (seed) {
   return random(seed) * Math.PI * 2;
};

module.exports.within_range = within_range = function (a, b, distance) {
   return distance(a, b) <= Math.abs(distance);
};

module.exports.bound = bound = function (value, new_value, max_delta) {
   if (typeof new_value === 'undefined' || new_value === null) {
      return value;
   }
   
   var diff = value - new_value;
   var abs = Math.abs(diff);

   if (abs > max_delta) {
      return value + (max_delta * round(diff / abs));
   } else {
      return new_value;
   }
};

module.exports.bound_heading = bound_heading = function (value, new_value, max_delta) {
   if (typeof new_value === 'undefined' || new_value === null) {
      return value;
   }
   
   var diff = value - new_value;
   var abs = Math.abs(diff);

   if (abs > max_delta) {
      return value + (max_delta * round(diff / abs));
   } else {
      return new_value;
   }
};

module.exports.distance = distance = function (a, b) {
   return Math.sqrt(Math.pow((a.x - b.x) , 2) + Math.pow((a.y - b.y), 2));
};

module.exports.heading = heading = function (a, b) {
   var h = distance(a, b);
   
};

module.exports.is_within_radians = within_radians = function (a, b, delta)) {

};

module.exports.move = move = function (position, distance, heading) {

};