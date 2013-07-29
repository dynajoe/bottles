var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var path = require('path');
var cookie = require('cookie');

io.set('log level', 2);
var session_key = 'sid';

module.exports.start = function (port, match_store) {
  app.configure(function () {
    app.set('port', port);
    app.use(express.static(path.join(__dirname, 'public')));
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.use(require('connect-assets')({
      src: __dirname + '/assets'
    }))
    app.use(require('stylus').middleware(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.static('public'));
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session({ key: session_key, secret: 'keyboard cat' }));
    app.use(app.router);
    app.use(express.logger('dev'));
  });

  io.set('authorization', function (data, accept) {
    if (data.headers.cookie) {
      data.cookie = cookie.parse(data.headers.cookie);
      data.session_id = data.cookie[session_key];
      return accept(null, true);
    }
    
    return accept('No cookie data', false);
  }); 

  require('./controllers/viewer')(app, io, match_store);

  server.listen(app.get('port'));
};