'use strict';

module.exports.name = 'sprinkler';
module.exports.tick = function (sensors, cb) {
   var commands = {
      radar_heading: sensors.radar_heading - 1,
      turret_heading: sensors.turret_heading + 1,
      fire_power: 1,
   };
   
   cb(commands);
};