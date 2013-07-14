var Bot = function (name) {
   this.name = name;
};

Bot.prototype.tick = function (cb) {
   setTimeout(function () {
      cb({
         heading: Math.PI /2,
         speed: 5,
         radar_heading: Math.PI / 4,
         turret_heading: Math.PI / 8,
         fire_power: 6
      });
    }, 50);
};

module.exports = Bot;