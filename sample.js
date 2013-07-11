var Match = require('./match');
var util = require('./util');
var Bot = require('./bot');

var m = new Match({
   max_ticks: 10000,
   max_bot_health: 100,
   seed: 100,
   bot_radius: 20,
   radar_vision: util.ONE_DEGREE * 20,
   max_heading_delta: util.ONE_DEGREE * 1.5,
   arena: {
      width: 1200,
      height: 700 },
   bot_timeout: 500
});

m.add_bot(new Bot('joe'));
m.add_bot(new Bot('joe'));

m.start();