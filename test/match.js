var assert = require('assert');
var Match = require('../lib/match');
var node_util = require('util');
var util = require('../lib/util');

var mock_bot = function (config) {
	config = config || { name: 'mock' };
	return {
		name: config.name,
		tick: function (sensors, cb) {
			cb(config.commands)
		}
	}
};

var wrap = function (match) {
	return {
		add_bots: function (num, bot) {
			for (var i = 0; i < num; i++) {
				match.add_bot(bot || mock_bot());	
			}
			return wrap(match);
		},
		start: function () {
			match.start();
			return wrap(match);
		},
		set_values: function (bot_index, values) {
			match.bots[bot_index] = node_util._extend(match.bots[bot_index], values);
			return wrap(match);
		}
	};
};

describe('match', function () {
   describe('#update_radars()', function () {
   	beforeEach(function () {
   		this.match = new Match();
   	});
   	it('should be able to detect a bot in the radar', function () {
   		wrap(this.match)
   			.add_bots(2)
   			.start()
   			.set_values(0, { position: { x: 0, y: 0 }, radar_heading: 0 })
   			.set_values(1, { position: { x: 0, y: 10 } });

   		this.match.update_radars();

   		assert.equal(this.match.bots[0].radar.length, 1);
   	});
   	it('should be able to detect a bot in the radar to the right', function () {
   		wrap(this.match)
   			.add_bots(2)
   			.start()
   			.set_values(0, { position: { x: 0, y: 0 }, radar_heading: util.EIGHTH_ANGLE + (util.ONE_DEGREE * 10.0) })
   			.set_values(1, { position: { x: 10, y: 10 } });

   		this.match.update_radars();

   		assert.equal(this.match.bots[0].radar.length, 1);
   	});
   	it('should not detect a bot to the right of the radar', function () {
   		wrap(this.match)
   			.add_bots(2)
   			.start()
   			.set_values(0, { position: { x: 0, y: 0 }, radar_heading: util.EIGHTH_ANGLE + (util.ONE_DEGREE * 11.0) })
   			.set_values(1, { position: { x: 10, y: 10 } });

   		this.match.update_radars();

   		assert.equal(this.match.bots[0].radar.length, 0);
   	});
   });
});