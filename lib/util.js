(function () {
   var FULL_ANGLE = module.exports.FULL_ANGLE = Math.PI * 2;
   var HALF_ANGLE = module.exports.HALF_ANGLE = Math.PI;
   var QUARTER_ANGLE = module.exports.QUARTER_ANGLE = FULL_ANGLE / 4;
   var EIGHTH_ANGLE = module.exports.EIGHTH_ANGLE = FULL_ANGLE / 8;
   var ONE_DEGREE = module.exports.ONE_DEGREE = FULL_ANGLE / 360;
   

   var round = module.exports.round = function (x, places) {
      var m = Math.pow(10, places || 0);
      return Math.round(m * x) / m;
   };

   var to_degrees = module.exports.to_degrees = function (radians) {
      return (radians / FULL_ANGLE) * 360;
   };

   var random = module.exports.random = function (seed) {
      return Math.random();
   };

   var is_number = module.exports.is_number = function (val) {
      return typeof val === 'number';
   };

   var random_angle = module.exports.random_angle = function (seed) {
      return random(seed) * FULL_ANGLE;
   };

   var is_within_range = module.exports.is_within_range = function (a, b, dist) {
      return distance(a, b) <= Math.abs(dist);
   };

   var normalize_radians = module.exports.normalize_radians = function (radians) {
       var x = radians / FULL_ANGLE;
       x = x - Math.floor(x);

       if (x < 0) x = 1 + x

       return x * FULL_ANGLE;
   };

   var bound = module.exports.bound = function (position, area) {
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

   var bound_heading = module.exports.bound_heading = function (value, new_value, max_delta) {
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

   var delta_radians = module.exports.delta_radians = function (headingA, headingB) {
      var diff = Math.abs(headingA - headingB) % FULL_ANGLE;
      
      if (diff > Math.PI) {
         diff = -(FULL_ANGLE - diff);      
      }

      return headingA < headingB ? -diff : diff;
   };

   var is_within_rect = module.exports.is_within_rect = function (position, rect) {
      if (position.x < 0 || position.y < 0)
         return false;

      if (position.x > rect.width || position.y > rect.height)
         return false;

      return true;
   };

   var distance = module.exports.distance = function (pointA, pointB) {
      return Math.sqrt(Math.pow((pointA.x - pointB.x) , 2) + Math.pow((pointA.y - pointB.y), 2));
   };

   var heading = module.exports.heading = function (pointA, pointB) {
      var result = (pointA.x == pointB.x && pointA.y == pointB.y ) ? 0.0 : Math.atan2(pointB.x - pointA.x, pointB.y - pointA.y);
      if (result < 0) { result += FULL_ANGLE; }
      return result;
   };

   var is_within_radians = module.exports.is_within_radians = function (headingA, headingB, range) {
      var max = round(range / 2, 6);
      var min = -max;
      var delta = round(delta_radians(headingA, headingB), 6);
      return (delta >= min && delta <= max);
   };

   var move = module.exports.move = function (position, heading, speed, bounding_area) {
      var new_pos = {
         x: position.x + speed * round(Math.cos(heading + QUARTER_ANGLE), 10),
         y: position.y + speed * round(Math.sin(heading + QUARTER_ANGLE), 10)
      };

      if (bounding_area)  
         return bound(new_pos, bounding_area);
      else
         return new_pos;
   };
})();