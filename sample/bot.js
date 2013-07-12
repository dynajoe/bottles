var Bot = function (name) {
   this.name = name;
};

Bot.prototype.tick = function (cb) {
   cb({
      speed: 1,
      heading: Math.PI / 2
   });
};

module.exports = Bot;