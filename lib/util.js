module.exports.FULL_ANGLE = FULL_ANGLE = Math.PI * 2;
module.exports.ONE_DEGREE = HALF_ANGLE = Math.PI / 2;
module.exports.ONE_DEGREE = QUARTER_ANGLE = Math.PI / 4;
module.exports.ONE_DEGREE = ONE_DEGREE = Math.PI / 180;

module.exports.round = round = function (x, places) {
   var m = (10 * (places || 0) || 1);

   return Math.round(m * x) / m;
};

module.exports.random = random = function (seed) {
   return Math.random();
};

module.exports.is_number = is_number = function (val) {
   return typeof val === 'number';
};

module.exports.random_angle = random_angle = function (seed) {
   return random(seed) * Math.PI * 2;
};

module.exports.is_within_range = is_within_range = function (a, b, dist) {
   return distance(a, b) <= Math.abs(dist);
};

module.exports.normalize_radians = normalize_radians = function (radians) {
    var x = radians / FULL_ANGLE;
    x = x - Math.floor(x);

    if (x < 0) x = 1 + x

    return x * FULL_ANGLE;
};

module.exports.bound = bound = function (position, area) {
   var x = position.x;
   var y = position.y;

   if (position.x > area.width)
      x = area.width;
   if (position.x < 0)
      x = 0;
   if (position.y > area.height)
      y = area.height;
   if (position.y < 0)
      y = 0;

   return { x: x, y: y };
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

module.exports.is_within_rect = is_within_rect = function (position, rect) {
   if (position.x < 0 || position.y < 0)
      return false;

   if (position.x > rect.width || position.y > rect.height)
      return false;

   return true;
};

module.exports.distance = distance = function (pointA, pointB) {
   return Math.sqrt(Math.pow((pointA.x - pointB.x) , 2) + Math.pow((pointA.y - pointB.y), 2));
};

module.exports.heading = heading = function (pointA, pointB) {
   var result = (pointA.x == pointB.x && pointA.y == pointB.y ) ? 0.0 : Math.atan2(pointB.x - pointA.x, pointB.y - pointA.y);
   if (result < 0) { result += FULL_ANGLE; }
   return result;
};

module.exports.is_within_radians = is_within_radians = function (headingA, headingB, range) {
   var max = range / 2;
   var min = -max;
   var delta = delta_radians(headingA, headingB);

   return (delta >= min && delta <= max);
};

module.exports.move = move = function (position, heading, speed, bounding_area) {
   var new_pos = {
      x: position.x + speed * round(Math.cos(heading + HALF_ANGLE), 10),
      y: position.y + speed * round(Math.sin(heading + HALF_ANGLE), 10)
   };

   if (bounding_area)  
      return bound(new_pos, bounding_area);
   else
      return new_pos;
};