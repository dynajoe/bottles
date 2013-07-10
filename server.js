var net = require('net');
var Match = require('./match');
var Bot = require('./bot');

var bots = [];

var server = net.createServer(function (socket) {
   
   var bot = new Bot(socket);

   bots.push(bot);

   if (bots.length > 0) {
      new Match(bots.slice(0));
   };

   socket.on('close', function () {
      var index = bots.indexOf(bot);
      bot.disconnected = true;
      bots.splice(index, 1);
   });
});

server.listen(3000);