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
         match.add_shell(
            shell.owner, 
            shell.position || { x: 10, y: 10 },
            shell.speed || 1,
            shell.heading || 0,
            shell.fire_power || 1
         );   

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
            b.position.x.should.be.within(0, this.match.config.arena.width - 1);
            b.position.y.should.be.within(0, this.match.config.arena.height - 1);
            b.heading.should.be.above(0);
            b.heading.should.be.below(Math.PI * 2);
            b.heading.should.equal(b.turret_heading);
            b.heading.should.equal(b.radar_heading);
            b.fire_power.should.equal(0);
            b.speed.should.equal(0);
            b.health.should.equal(this.match.config.max_bot_health);
            b.energy.should.equal(this.match.config.max_bot_energy);
         }, this);
      });
   });
   describe('#tick_commands()', function () {
      beforeEach(function () {
         wrap(this.match)
            .add_bot()
            .initialize();
      });
      it('should update the radar heading to the right', function () {
         var bot = this.match.bots[0];
         bot.radar_heading = 0;

         this.match.tick_commands([{
            bot: bot,
            command: { 
               radar_heading: bot.radar_heading + Math.PI
            }
         }]);

         bot.radar_heading.should.equal(this.match.config.max_heading_delta);
      });
      it('should update the radar heading to the left', function () {
         var bot = this.match.bots[0];
         bot.radar_heading = 0;

         this.match.tick_commands([{
            bot: bot,
            command: { 
               radar_heading: bot.radar_heading - Math.PI / 4
            }
         }]);

         bot.radar_heading.should.equal(-this.match.config.max_heading_delta);
      });
      it('should be able to move up', function () {         
         var bot = this.match.bots[0];

         bot.position = { x: this.match.config.bot_radius, y: this.match.config.bot_radius };
         bot.heading = 0;

         this.match.tick_commands([{
            bot: bot,
            command: { 
               speed: 1
            }
         }]);

         bot.position.x.should.equal(this.match.config.bot_radius);
         bot.position.y.should.equal(this.match.config.bot_radius + 1);
      });
      it('should be able to move to the right', function () {
         var bot = this.match.bots[0];

         bot.position = { x: this.match.config.bot_radius, y: this.match.config.bot_radius };
         bot.heading = Math.PI / 2;

         this.match.tick_commands([{
            bot: bot,
            command: { 
               speed: 1
            }
         }]);

         bot.position.x.should.equal(this.match.config.bot_radius + 1);
         bot.position.y.should.equal(this.match.config.bot_radius);
      });
      it('should be able to move to the right and up', function () {
         var bot = this.match.bots[0];

         bot.position = { x: this.match.config.bot_radius, y: this.match.config.bot_radius };
         bot.heading = Math.PI / 4;

         this.match.tick_commands([{
            bot: bot,
            command: { 
               speed: Math.sqrt(2)
            }
         }]);

         util.round(bot.position.x, 5).should.equal(this.match.config.bot_radius + 1);
         util.round(bot.position.y, 5).should.equal(this.match.config.bot_radius + 1);
      });
   });
   describe('#tick_shells()', function () {
      it('should hit if the shell is close enough to an opposing bot', function () {
         wrap(this.match)
            .add_bot()
            .add_bot()
            .initialize()
            .add_shell({ 
               owner: this.match.bots[0].id, 
               position: { x: 10, y: 10 } }
            )
            .set_values(1, { position: { x: 10, y: 10 } });

         this.match.tick_shells();

         assert.equal(this.match.shells[0].is_dead, true);
      });
      it('should reduce the health of a bot when a shell hits', function () {
         wrap(this.match)
            .add_bot()
            .add_bot()
            .initialize()
            .add_shell({ 
               owner: this.match.bots[0].id, 
               position: { x: 10, y: 10 } }
            )
            .set_values(1, { position: { x: 10, y: 10 } });

         var before = this.match.bots[0].health;
         
         this.match.tick_shells();

         assert.equal(before > this.match.bots[1].health, true);
      });
      it('should not damage the shooter', function () {
         wrap(this.match)
            .add_bot()
            .initialize()
            .add_shell({ 
               owner: this.match.bots[0].id, 
               position: { x: 10, y: 10 } }
            )
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
   			.set_values(0, { position: { x: 0, y: 0 }, radar_heading: util.ONE_DEGREE * 40.0 })
   			.set_values(1, { position: { x: 10, y: 10 } });

   		this.match.update_radars();

         this.match.bots[0].radar.length.should.equal(1);
   	});
   	it('should not detect a bot to the right of the radar', function () {
   		wrap(this.match)
   			.add_bots(2)
   			.initialize()
   			.set_values(0, { position: { x: 0, y: 0 }, radar_heading: util.ONE_DEGREE * 35.0 })
   			.set_values(1, { position: { x: 10, y: 10 } });
   		
   		this.match.update_radars();

   		assert.equal(this.match.bots[0].radar.length, 0);
   	});
   	it('should not detect a bot to the left of the radar', function () {
   		wrap(this.match)
   			.add_bots(2)
   			.initialize()
   			.set_values(0, { position: { x: 0, y: 0 }, radar_heading: util.ONE_DEGREE * 56.0 })
   			.set_values(1, { position: { x: 10, y: 10 } });
   		
   		this.match.update_radars();

   		assert.equal(this.match.bots[0].radar.length, 0);
   	});
   });
});