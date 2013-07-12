var engine = require('engine.io');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var path = require('path');

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(require('connect-assets')())
});

require('./controllers/viewer')(app);

var http = server.listen(app.get('port'));
var engineio = engine.attach(http)

engineio.on('connection', function (socket) {
  socket.send('utf 8 string');
});