var Bot = function (name) {
   this.name = name;
};

Bot.prototype.tick = function (cb) {
   setTimeout(function () {
      cb({
         speed: 5,
         heading: Math.PI / 2,
         radar_heading: Math.PI / 4,
         turret_heading: Math.PI / 8,
         fire_power: 6
      });
    }, 50);
};

module.exports = Bot;