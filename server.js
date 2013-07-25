var tcp_server = require('./tcp/server');
var web_server = require('./web/index.js');
var MatchStore = require('./lib/match_store.js');

var store = new MatchStore();

web_server.start(3000, store);
tcp_server.start(4000, store);