var Match = require('../../lib/match');
var util = require('../../lib/util');
var _ = require('underscore');
var DEFAULT_MATCH_ID = '0';

var get_default_brain = function () {
   return 'module.exports = ' + require('../../samples/seeker').tick.toString()
};

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
      id: socket.handshake.session_id,
      socket: socket,
      tick: function (sensors, cb) {
         socket.emit('brain_tick', sensors);
         callback = cb;
      }
   };
};

var register_with_match = function (m) {
   var match_started = function (data) {

   };

   var match_tick = function (data) {
      m.bots.forEach(function (b) {
         if (m.brains[b.id].socket) {
            m.brains[b.id].socket.emit('tick', data);
         }
      });
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

module.exports = function (app, io, match_store) {
   var create_default_match = function (overwrite) {
      var original_match = match_store._store[DEFAULT_MATCH_ID];

      if (original_match && !overwrite) {
         return;
      }

      var match = null;

      if (original_match) {
         original_match.stop();
         match = original_match.clone();
      }
      else {
         match = new Match({
            arena: { width: 400, height: 300 }
         });
      }

      register_with_match(match);
      match_store._store[DEFAULT_MATCH_ID] = match;
   };

   var start_default_match = function (force) {
      create_default_match(force);
      match_store._store[DEFAULT_MATCH_ID].start();
   };
   
   create_default_match();

   io.on('connection', function (socket) {   
      
      socket.on('restart', function (match_id) {
         start_default_match(true);
      });

      socket.on('join', function (match_id, cb) {
         match_store.find_by_id(match_id, function (err, match) {            
            if (match) { 
               var bot_id = socket.handshake.session_id;
               var bot = _.find(match.bots, function (b) { return b.id === bot_id; });

               if (!bot) {
                  match.add_bot(new_bot_brain(socket));
               }
               else {
                  console.log('updating brain for ' + bot_id);
                  bot.brain = new_bot_brain(socket);
               }

               return cb(null);
            }

            return cb(err);
         });
      });
   });

   match_store.find_all(function (err, matches) {
      matches.forEach(register_with_match);
   });

   match_store.on('new', register_with_match);
   
   match_store.find_by_id(DEFAULT_MATCH_ID, function (err, m) {
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
         default_brain: get_default_brain()
      });
   });
};