'use strict';

module.exports.name = 'sentry';
module.exports.tick = function (sensors, cb) {
    var speed = sensors.radar.length ? Math.PI / 3600 : 1;
    var commands = {
      radar_heading: sensors.turret_heading,
      turret_heading: sensors.turret_heading + (sensors.ticks > 360 ? speed : 0),
      fire_power: Math.min(1, sensors.radar.length),
    };
   
   cb(commands);
};