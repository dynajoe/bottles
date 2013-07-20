var tcp_server = require('./tcp/server');
var web_server = require('./web/index.js');
var match_store = require('./lib/match_store.js');

web_server.start(3000, match_store);
tcp_server.start(4000, match_store);