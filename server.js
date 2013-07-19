var net = require('net');
var Match = require('./lib/match');
var sockets = [];
var socket_count = 0;
var match = new Match();

var server = net.createServer(function (socket) {
   sockets.push(socket);

   var callback = null;
   var disconnected = false;

   match.add_bot({
      name: 'tcp' + socket_count++,
      tick: function (sensors, cb) {
         if (!disconnected) {
            socket.write(JSON.stringify(sensors) + '\n');   
            callback = cb;
         }
      }
   });

   if (sockets.length > 1 && !match.is_started) {
      match.start();
   }

   socket.on('data', function (buffer) {
      var data = buffer.toString();

      if (data.indexOf("{") == 0 && callback) {
         callback(JSON.parse(data));
         callback = null;
      }
   });

   socket.on('end', function () {
      disconnected = true;
      sockets.splice(sockets.indexOf(socket), 1);
   });
});

server.listen(4000);