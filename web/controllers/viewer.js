var Match = require('../../lib/match');
var util = require('../../lib/util');

var new_bot_brain = function (socket) {
   var callback = null;
   
   socket.on('brain_tick', function (commands) {
      if (callback) {
         callback(commands);
         callback = null;
      }
   });

   return {
      name: socket.id,
      tick: function (sensors, cb) {
         socket.emit('brain_tick', sensors);
         callback = cb;
      }
   };
};

module.exports = function (app, io, match_store) {
   io.on('connection', function (socket) {      
      socket.on('join', function (match_id, cb) {
         match_store.find_by_id(match_id, function (err, m) {
            if (m) { 
               m.add_bot(new_bot_brain(socket));
               return cb(null);
            }

            return cb(err);
         });
      });
   });

   var register_with_match = function (m) {
      var match_started = function (data) {

      };

      var match_tick = function (data) {
         io.sockets.emit('tick', data);
      };

      var match_ended = function (data) {
         m.removeListener('start', match_started);
         m.removeListener('end', match_ended);
         m.removeListener('tick', match_tick);
      };

      m.on('start', match_started);
      m.on('end', match_ended);
      m.on('tick', match_tick);
   };

   match_store.find_all(function (err, matches) {
      matches.forEach(register_with_match);
   });

   match_store.on('new', register_with_match);
   
   match_store.find_by_id(0, function (err, m) {
      m.add_bot({
         name: 'test',
         tick: function (s, c) {c({})}
      });

      m.once('bot_entered', function () {
         m.start();
      });
   });

   app.get('/', function (req, res) {
      res.render('index', {
         default_brain: 'module.exports.tick = function (sensors, cb) {\n' +
         '   cb({\n' +
         '      speed: 3,\n' +
         '      heading: Math.PI / 4\n' +
         '   });\n' +
         '}\n' 
      });
   });
};