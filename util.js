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
   return Math.sqrt(Math.pow((a.x - b.x) , 2) + Math.pow((a.y - b.y), 2)) <= Math.abs(distance);
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

module.exports.move = move = function (position, distance, heading) {

};