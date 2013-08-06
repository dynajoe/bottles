'use strict';
var Vector = require('./vector');
var MersenneTwister = require('./random');

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
   
   var ensure_bounds = module.exports.ensure_bounds = function (position, bounds) {
      var x = position.x;
      var y = position.y;

      if (position.x > bounds.max.x) 
         x = bounds.max.x;
      else if (position.x < bounds.min.x) 
         x = bounds.min.x;

      if (position.y > bounds.max.y)
         y = bounds.max.y;
      else if (position.y < bounds.min.y)
         y = bounds.min.y;

      return { x: x, y: y };
   };

   var to_degrees = module.exports.to_degrees = function (radians) {
      return (radians / FULL_ANGLE) * 360;
   };

   var new_random_generator = module.exports.new_random_generator = function (seed) {
      return new MersenneTwister(seed);
   };

   var is_number = module.exports.is_number = function (val) {
      return typeof val === 'number';
   };

   var is_within_range = module.exports.is_within_range = function (a, b, dist) {
      return distance(a, b) <= Math.abs(dist);
   };

   var normalize_radians = module.exports.normalize_radians = function (radians) {
      if (is_between(radians, 0, FULL_ANGLE))
         return radians;

      var x = radians / FULL_ANGLE;
      x = x - Math.floor(x);

      if (x < 0) x = 1 + x;

      return x * FULL_ANGLE;
   };

   var bound = module.exports.bound = function (position, area) {
      var x = position.x;
      var y = position.y;

      if (x > area.width)
         x = area.width;
      if (x < 0)
         x = 0;
      
      if (y > area.height)
         y = area.height;
      if (y < 0)
         y = 0;

      return { x: x, y: y };
   };

   var bound_heading = module.exports.bound_heading = function (value, new_value, max_delta) {
      if (typeof new_value === 'undefined' || new_value === null)
         return value;

      var d = delta_radians(value, new_value);

      if (Math.abs(d) > max_delta)
         return d > 0 ? value + max_delta : value - max_delta;
      else 
         return new_value;
   };
   
   var bound_int = module.exports.bound_int = function (value, min, max) {
      return bound_number(parseInt(value, 10), min, max);
   };

   var bound_number = module.exports.bound_number = function (value, min, max) {
      if (value < min)
         return min;
      
      if (value > max) 
         return max;

      return value;
   };

   var delta_radians = module.exports.delta_radians = function (from, to) {
      var diff = Math.abs(from - to) % FULL_ANGLE;
      
      if (diff > Math.PI) {
         diff = -(FULL_ANGLE - diff);      
      }

      return to < from ? -diff : diff;
   };

   var is_within_rect = module.exports.is_within_rect = function (position, rect) {
      if (position.x < 0 || position.y < 0)
         return false;

      if (position.x > rect.width || position.y > rect.height)
         return false;

      return true;
   };

   var distance = module.exports.distance = function (pointA, pointB) {
      return new Vector(pointA).distance(new Vector(pointB));
   };
   
   var heading_delta_between_points = module.exports.heading_delta_between_points = function (pointA, headingA, pointB) {
      var rel_heading = heading_between_points(pointA, pointB);
      return delta_radians(headingA, rel_heading);
   };

   var heading_between_points = module.exports.heading_between_points = function (from, to) {
      var result = (from.x === to.x && from.y === to.y) ? 0.0 : Math.atan2(to.x - from.x, to.y - from.y);
      return result;
   };
   
   var is_between = module.exports.is_between = function (value, min, max) {
      return value >= min && value <= max;
   };

   var move = module.exports.move = function (position, heading, speed, bounding_area) {
      var new_pos = {
         x: position.x + speed * round(Math.sin(heading), 10),
         y: position.y + speed * round(Math.cos(heading), 10)
      };

      if (bounding_area)  
         return bound(new_pos, bounding_area);
      else
         return new_pos;
   };

   var detect_collision = module.exports.detect_collision = function (previous_pos, current_pos, target_pos, target_radius) {
      var shell_vector = new Vector(current_pos).subtract(new Vector(previous_pos));
      var bot_vector = new Vector(target_pos).subtract(new Vector(previous_pos));
      
      //project bot vector onto destination vector
      //see http://stackoverflow.com/a/1079478 
      var dp = bot_vector.dot(shell_vector);
      var shell_vector_mag = shell_vector.magnitude();
      var shell_normal = shell_vector.normalize();
      var proj = shell_normal.multiply(dp).divide(shell_vector_mag);
      var proj_mag = proj.magnitude();

      if (proj_mag > shell_vector_mag)
         return false;

      return proj.distance(bot_vector) <= target_radius;
   };

   var generate_id = module.exports.generate_id = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
         var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
         return v.toString(16);
      });
   };
})();