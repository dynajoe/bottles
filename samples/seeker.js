'use strict';

module.exports.tick = function (sensors, cb) {
   var commands = {
      speed: 4,
      radar_heading: sensors.radar_heading + 1
   };

   if (sensors.radar.length > 0) {
      commands.fire_power = 1;
      commands.radar_heading = commands.heading = commands.turret_heading = sensors.radar[0].heading;
   }
   
   cb(commands);
};