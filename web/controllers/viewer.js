var Match = require('../../lib/match');
var Bot = require('../../sample/bot');
var util = require('../../lib/util');

module.exports = function (app, io) {
   io.set('log level', 1);

   io.on('connect', function (socket) {
      console.log('connected');
   });

   var match = new Match({
      max_ticks: 5000,
      max_bot_health: 100,
      seed: 100,
      bot_radius: 20,
      radar_vision: util.ONE_DEGREE * 20,
      max_heading_delta: util.ONE_DEGREE * 1.5,
      shell_ratio: 1.5,
      gun_energy_factor: 1.5,
      arena: {
         width: 800,
         height: 600 
      },
      max_gun_energy: 5,
      bot_timeout: 500
   });

   for (var i = 0; i < 2; i++) {
      match.add_bot(new Bot(i));  
   }

   match.on('start', function (data) {
      io.sockets.emit('start', data);
   });

   match.on('end', function (data) {
      io.sockets.emit('end', data);
   });

   match.on('tick', function (data) {
      io.sockets.emit('tick', data);
   });

   match.start();
   
   app.get('/', function (req, res) {
      res.render('index');
   });
};