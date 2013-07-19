var Match = require('../../lib/match');
var Bot = require('../../sample/bot');
var util = require('../../lib/util');

module.exports = function (app, io) {
   io.set('log level', 2);

   var match = new Match();

   for (var i = 0; i < 2; i++) {
      match.add_bot(new Bot(i));  
   }

   match.initialize = function () {
      this.is_started = true;

      this.bots.forEach(function (b) {
         b.name = b.name;
         b.position = {x: 200, y: 200}
         b.heading = Math.PI / 4;
         b.turret_heading = b.heading;
         b.radar_heading = b.heading;
         b.fire_power = 0;
         b.speed = 1;
         b.health = this.config.max_bot_health;
         b.energy = this.config.max_bot_energy;
      }, this);
   };

   io.on('connection', function (socket) {
      var callback = null;
      
      match.bots[0].brain.tick = function (sensors, cb) {
         socket.emit('brain_tick', sensors);
         callback = cb;
      };

      socket.on('brain_tick', function (commands) {
         if (callback) {
            callback(commands);
            callback = null;
         }
      });
   });

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