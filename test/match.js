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
      add_bot: function (bot) {
         return wrap(match).add_bots(1, bot);
      },
		add_bots: function (num, bot) {
			for (var i = 0; i < num; i++) {
				match.add_bot(bot || mock_bot());	
			}
			return wrap(match);
		},
      add_shell: function (shell) {
         match.shells.push({ 
            position: shell.position || {x: 10, y: 10},
            fire_power: shell.fire_power || 1,
            heading: shell.heading || 0, 
            speed: shell.speed || 1, 
            name: match.shells.length,
            owner: shell.owner
         });   

         return wrap(match);
      },
		initialize: function () {
			match.initialize();
			return wrap(match);
		},
		set_values: function (bot_index, values) {
			match.bots[bot_index] = node_util._extend(match.bots[bot_index], values);
			return wrap(match);
		}
	};
};

describe('match', function () {
   beforeEach(function () {
      this.match = new Match();
   });
   describe('#initialize()', function () {
      it('should initialize all of the bots with default values', function () {
         wrap(this.match)
            .add_bots(10)
            .initialize();

         this.match.bots.forEach(function (b) {
            assert.equal(b.position.x <= this.match.config.arena.width, true);
            assert.equal(b.position.y <= this.match.config.arena.height, true);
            assert.equal(b.position.x >= 0, true);
            assert.equal(b.position.y >= 0, true);
            assert.equal(b.heading < Math.PI * 2, true);
            assert.equal(b.heading >= 0, true);
            assert.equal(b.heading, b.turret_heading);
            assert.equal(b.heading, b.radar_heading);
            assert.equal(b.fire_power, 0);
            assert.equal(b.speed, 0);
            assert.equal(b.health, this.match.config.max_bot_health);
            assert.equal(b.energy, this.match.config.max_bot_energy);
         }, this);
      });
   });
   describe('#tick_commands()', function () { 
      it('should be able to move up', function () {
         wrap(this.match)
            .add_bot()
            .initialize();
         
         var bot = this.match.bots[0];

         bot.position = { x: 0, y: 0 };
         bot.heading = 0;

         this.match.tick_commands([{
            bot: bot,
            command: { 
               speed: 1
            }
         }]);

         assert.equal(bot.position.x, 0);
         assert.equal(bot.position.y, 1);
      });

      it('should be able to move to the right', function () {
         wrap(this.match)
            .add_bot()
            .initialize();
         
         var bot = this.match.bots[0];

         bot.position = { x: 0, y: 0 };
         bot.heading = Math.PI / 2;

         this.match.tick_commands([{
            bot: bot,
            command: { 
               speed: 1
            }
         }]);

         assert.equal(bot.position.x, 1);
         assert.equal(bot.position.y, 0);
      });
   });
   describe('#tick_shells()', function () {
      it('should hit if the shell is close enough to bot', function () {
         wrap(this.match)
            .add_bot()
            .initialize()
            .add_shell({ position: { x: 10, y: 10 } })
            .set_values(0, { position: { x: 10, y: 10 } });

         this.match.tick_shells();

         assert.equal(this.match.shells[0].is_dead, true);
      });
      it('should reduce the health of a bot when a shell hits', function () {
         wrap(this.match)
            .add_bot()
            .initialize()
            .add_shell({ position: { x: 10, y: 10 } })
            .set_values(0, { position: { x: 10, y: 10 } });

         var before = this.match.bots[0].health;
         
         this.match.tick_shells();

         assert.equal(before > this.match.bots[0].health, true);
      });
      it('should not damage the shooter', function () {
         wrap(this.match)
            .add_bot({ name: 'shooter' })
            .initialize()
            .add_shell({ position: { x: 10, y: 10 }, owner: 'shooter' })
            .set_values(0, { position: { x: 10, y: 10 } });

         var before = this.match.bots[0].health;
         
         this.match.tick_shells();

         assert.equal(before == this.match.bots[0].health, true);
      });
   });
   describe('#update_radars()', function () {
   	it('should be able to detect a bot in the radar', function () {
   		wrap(this.match)
   			.add_bots(2)
   			.initialize()
   			.set_values(0, { position: { x: 0, y: 0 }, radar_heading: 0 })
   			.set_values(1, { position: { x: 0, y: 10 } });

   		this.match.update_radars();

   		assert.equal(this.match.bots[0].radar.length, 1);
   	});
   	it('should be able to detect a bot in the radar to the right', function () {
   		wrap(this.match)
   			.add_bots(2)
   			.initialize()
   			.set_values(0, { position: { x: 0, y: 0 }, radar_heading: util.EIGHTH_ANGLE + (util.ONE_DEGREE * 10.0) })
   			.set_values(1, { position: { x: 10, y: 10 } });

   		this.match.update_radars();

   		assert.equal(this.match.bots[0].radar.length, 1);
   	});
   	it('should not detect a bot to the right of the radar', function () {
   		wrap(this.match)
   			.add_bots(2)
   			.initialize()
   			.set_values(0, { position: { x: 0, y: 0 }, radar_heading: util.EIGHTH_ANGLE + (util.ONE_DEGREE * 11.0) })
   			.set_values(1, { position: { x: 10, y: 10 } });
   		
   		this.match.update_radars();

   		assert.equal(this.match.bots[0].radar.length, 0);
   	});
   	it('should not detect a bot to the left of the radar', function () {
   		wrap(this.match)
   			.add_bots(2)
   			.initialize()
   			.set_values(0, { position: { x: 0, y: 0 }, radar_heading: util.EIGHTH_ANGLE - (util.ONE_DEGREE * 11.0) })
   			.set_values(1, { position: { x: 10, y: 10 } });
   		
   		this.match.update_radars();

   		assert.equal(this.match.bots[0].radar.length, 0);
   	});
   });
});