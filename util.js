module.exports.FULL_ANGLE = FULL_ANGLE = Math.PI * 2;
module.exports.ONE_DEGREE = HALF_ANGLE = Math.PI / 2;
module.exports.ONE_DEGREE = ONE_DEGREE = Math.PI / 180;

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

module.exports.delta_radians = delta_radians = function (headingA, headingB) {
   var diff = Math.abs(headingA - headingB) % FULL_ANGLE;
   
   if (diff > Math.PI) {
      diff = -(FULL_ANGLE - diff);      
   }

   return headingA < headingB ? -diff : diff;
};

module.exports.distance = distance = function (pointA, pointB) {
   return Math.sqrt(Math.pow((pointA.x - pointB.x) , 2) + Math.pow((pointA.y - pointB.y), 2));
};

module.exports.heading = heading = function (pointA, pointB) {
   var result = (pointA.x == pointB.x && pointA.y == pointB.y ) ? 0.0 : Math.atan2(pointB.x - pointA.x, pointB.y - pointA.y);
   if (result < 0) { result += Math.PI * 2; }
   return result;
};

module.exports.is_within_radians = is_within_radians = function (headingA, headingB, range) {
   var max = range / 2;
   var min = -max;
   var delta = delta_radians(headingA, headingB);
   
   return (delta >= min && delta <= max);
};

module.exports.move = move = function (position, heading, speed) {
   return {
      x: position.x + speed * round(Math.cos(heading + HALF_ANGLE), 10),
      y: position.y + speed * round(Math.sin(heading + HALF_ANGLE), 10)
   };
};