var Match = require('../../lib/match');
var util = require('../../lib/util');
var _ = require('underscore');

var template_brains = {
   seeker: require('../../samples/seeker'),
   stump: require('../../samples/stump'),
   _default: require('../../samples/stump'),
};

var get_id = function (socket) {
   return socket.handshake.session_id;
};

var get_data = function (socket, key, cb) {
   socket.get(key, cb);
};

var get_current_match = function (socket, match_store, cb) {
   get_data(socket, 'current_match_id', function (err, match_id) {
      if (err) cb(err);      
      match_store.find_by_id(match_id, cb);
   });
};

var set_data = function (socket, key, value) {
   socket.set(key, value, function (err) {
      log('set ' + key + ' = ' + value + ' for ' + get_id(socket));
   });
};

var log = function () {
   var last_log = null;
   return function (message) {
      if (last_log && new Date().getTime() - last_log > 20)
         console.log('');

      console.log(message);
      last_log = new Date().getTime();
   }
}();

var get_default_brain = function () {
   return 'module.exports.tick = ' + require('../../samples/seeker').tick.toString()
};

var new_socket_brain = function (socket) {
   log('new socket brain ' + get_id(socket));
   var callback = null;
   
   socket.on('brain_tick', function (commands) {
      if (callback) {
         callback(commands);
         callback = null;
      }
   });

   return {
      name: socket.id,
      id: get_id(socket),
      socket: socket,
      tick: function (sensors, cb) {
         socket.emit('brain_tick', sensors);
         callback = cb;
      }
   };
};

var register_with_match = function (match) {
   log('registering match handlers ' + match.id);

   var match_started = function (data) {
      log('match started ' + match.id);
      match.bots.forEach(function (b) {
         if (match.brains[b.id].socket) {
            match.brains[b.id].socket.emit('start', data);
         }
      });
   };

   var bot_entered = function () {
      log('bot entered ' + match.id);
   };

   var match_tick = function (data) {
      match.bots.forEach(function (b) {
         if (match.brains[b.id].socket) {
            match.brains[b.id].socket.emit('tick', data);
         }
      });
   };

   var match_ended = function (data) {
      log('match ended (' + data.reason + ') ' + match.id);

      match.removeListener('start', match_started);
      match.removeListener('bot_entered', bot_entered);
      match.removeListener('tick', match_tick);
      match.bots.forEach(function (b) {
         if (match.brains[b.id].socket) {
            match.brains[b.id].socket.emit('end', data);
         }
      });
   };

   match.once('start', match_started);
   match.once('end', match_ended);
   match.on('bot_entered', bot_entered);
   match.on('tick', match_tick);
};

var setup_socket = function (socket, match_store) {
   log('setting up socket ' + get_id(socket));

   socket.on('restart', function () {
      log('restart sent from ' + get_id(socket));

      get_current_match(socket, match_store, function (err, old_match) {
         if (old_match) {
            old_match.stop();

            var new_match = old_match.clone();
            log('cloned match ' + old_match.id + ' to ' + new_match.id);

            for (var id in old_match.brains) {
               if (old_match.brains[id].socket)
                  set_data(old_match.brains[id].socket, 'current_match_id', new_match.id);
            }

            match_store.add(new_match);
            new_match.start();
         }
         else {
            log('No match found');
         }
      });
   });

   var computerId = null;
   var create_computer_bot = function(brainName){
      var bot = create_computer_brain(brainName);
      return {
         name: (bot.name ? bot.name : 'Computah') + computerId++,
         tick: bot.tick,
      };
   };
   var create_computer_brain = function(brainName){
      var brain = template_brains[brainName];
      return brain ? brain : template_brains._default;
   };

   socket.on('add_comp', function (brainName) {
      log('adding computer bot from ' + get_id(socket) + ': ' + brainName);
      
      get_current_match(socket, match_store, function (err, match) {
         if (match) {
            match.add_bot(create_computer_bot(brainName));
         }
      });
   });

   socket.on('start', function () {
      log('start sent from ' + get_id(socket));

      get_current_match(socket, match_store, function (err, match) {
         if (match) {
            match.start();
         }
      });
   });

   socket.on('join', function (match_id) {
      log('join sent from ' + get_id(socket));

      match_store.find_by_id(match_id, function (err, match) {            
         if (!match) { 
            match = new Match({
               arena: { width: 400, height: 300 }
            });

            match_id = match.id;
            match_store.add(match);
         }

         get_data(socket, 'current_match_id', function (err, current_match_id) {
            if (err || current_match_id === match_id)
               return;

            match.add_bot(new_socket_brain(socket));
            set_data(socket, 'current_match_id', match_id);
         });
      
      });
   });
};

module.exports = function (app, io, match_store) {
   match_store.on('new', function (match) {
      log('new match created ' + match.id);
      register_with_match(match);
   });

   io.on('connection', function (socket) {   
      setup_socket(socket, match_store);
   });

   app.get('/', function (req, res) {
      res.render('index', {
         default_brain: get_default_brain(),
         random_match_id: util.generate_id()
      });
   });
};