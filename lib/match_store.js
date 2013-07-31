'use strict';
var util = require('./util');
var EventEmitter = require('events').EventEmitter;
var Match = require('./match');

var MatchStore = module.exports = function () {
   this._store = {};
};

MatchStore.prototype = new EventEmitter();

MatchStore.prototype.add = function (match, cb) {
   this._store[match.id] = match;
   this.emit('new', match);
   
   if (cb) cb(null, match.id);
};

MatchStore.prototype.find_by_id = function (id, cb) {
   var match = this._store[id];
   if (match) return cb(null, match);

   return cb('No match with id [' + id + ']'); 
};

MatchStore.prototype.find_all = function (cb) {
   var matches = [];

   for (var key in this._store) {
      if (this._store.hasOwnProperty(key)) {
         matches.push(this._store[key]);  
      }
   }
    
   return cb(null, matches);
};