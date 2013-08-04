'use strict';

module.exports.name = 'stump';
module.exports.description = "I am a stump and I ain't movin'";
module.exports.tick = function (sensors, cb) {
   var command = {};
   cb(command);
};