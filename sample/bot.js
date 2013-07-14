var Bot = function (name) {
   this.name = name;
};

Bot.prototype.tick = function (sensors, cb) {
   var commands = {
      speed: 5,
      fire_power: 3
   };

   if (sensors.radar.length > 0) {

      commands.radar_heading = sensors.radar[0].heading;
      commands.heading = commands.radar_heading;
      commands.turret_heading = commands.radar_heading;
   } else {
      commands.radar_heading = Math.PI / 4
      commands.heading = commands.radar_heading;
      commands.turret_heading = commands.radar_heading;
   }

   setTimeout(function () {
      cb(commands);
    }, 50);
};

module.exports = Bot;