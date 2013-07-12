var Match = require('../lib/match');
var util = require('../lib/util');
var Bot = require('./bot');

var m = new Match({
   max_ticks: 100,
   max_bot_health: 100,
   seed: 100,
   bot_radius: 20,
   radar_vision: util.ONE_DEGREE * 20,
   max_heading_delta: util.ONE_DEGREE * 1.5,
   shell_ratio: 1.5,
   gun_energy_factor: 1.5,
   arena: {
      width: 1200,
      height: 700 },
   bot_timeout: 500
});

Bot.prototype.tick = function (cb) {
   cb({
      fire_power: undefined,
      speed: 4,
      heading: Math.PI / 4
   });
};

for (var i = 0; i < 2; i++){
   m.add_bot(new Bot(i));
}

m.start();
m.on('tick', function (bots) {
   console.log(bots)
})
if (typeof v8debug === 'object') {
   var agent = require('webkit-devtools-agent');
}
