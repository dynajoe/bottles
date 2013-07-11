var Bot = function (name) {
   this.name = name;
};

Bot.prototype.tick = function (cb) {
   setTimeout(function () {
      cb({});
   }, 0);
};

module.exports = Bot;