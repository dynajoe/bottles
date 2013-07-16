var Bot = function (name) {
   this.name = name;
};

Bot.prototype.tick = function (sensors, cb) {
   setTimeout(function () {
      cb({});
    }, 50);
};

module.exports = Bot;