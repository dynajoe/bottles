var Match = require('../../lib/match');
var Bot = require('../../sample/bot');
var util = require('../../lib/util');

module.exports = function (app, io) {
   io.set('log level', 1);

   io.on('connect', function (socket) {
      console.log('connected');
   });

   var match = new Match();

   for (var i = 0; i < 2; i++) {
      match.add_bot(new Bot(i));  
   }

   match.bots[0].brain.tick = function (sensors, cb) {
      var commands = {
         fire_power: 3
      };

      commands.radar_heading = sensors.radar_heading + 0.1

      setTimeout(function () {
         cb(commands);
       }, 50);
   };


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