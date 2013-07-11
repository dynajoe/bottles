var EventEmitter = require('events').EventEmitter;
var util = require('./util');

/*
   config:
      max_ticks: infinite
      max_bot_health: 100
      seed: random
      bot_radius: 20
      radar_vision: 20 degrees to radians
      max_heading_delta: 1.5 degrees in radians
      arena: 
         width: 1200
         height: 700
      bot_timeout: 500
*/
var Match = function (config) {
   this.config = config;
   this.is_started = false;
   this.bots = [];
   this.shells = [];
};

Match.prototype = new EventEmitter;

Match.prototype.addBot = function (bot) {
   if (!this.is_started) {
      this.bots.push(bot);  
      this.emit('bot_entered', bot.name); 
   }
};

Match.prototype.random = function () {
   return util.random(this.seed);
};

Match.prototype.random_angle = function () {
   return util.random_angle(this.seed);
};

Match.prototype.update_radars = function () {
   for (var i = 0; i < this.bots.length; i++) {
      var b1 = this.bots[i];
      b1.radar = [];

      for (var i = 0; i < this.bots.length; i++) {
         var b2 = this.bots[j];

         if (b1 == b2 || b1.health <= 0 || b2.health <= 0) continue;

         var heading = util.heading(b1.position, b2.position);
         
         if (util.is_within_radians(b1.radar_heading, heading, config.radar_vision)) {
            b1.radar.push({ 
               name: b2.name, 
               distance: util.distance(b1.position, b2.position), 
               heading: heading
            });
         }
      }    
   }
};

Match.prototype.initialize = function () {
   this.is_started = true;

   this.bots.forEach(function (b) {
      b.position = { x: this.random() * this.config.arena.width, y: this.random() * this.config.arena.height };
      b.heading = this.random_angle();
      b.turret_heading = b.heading;
      b.radar_heading = b.heading;
      b.fire = 0;
      b.speed = 0;
      b.ticks = 0;
      b.health = this.config.max_bot_health;
   });
};

Match.prototype.tick_bots = function (done) {
   this.update_radars();

   var commands = [];
   var waitCount = this.bots.length;

   var decrement = function () {
      waitCount--;
      if (waitCount == 0) done(commands);
   };

   this.bots.forEach(function (bot) {
      if (bot.health <= 0) return;

      bot.timeout = false;

      bot.tick(function (command) {
         if (bot.timeout)
            return;
         commands.push({ bot: bot, command: command });
         decrement();
      });

      setTimeout(function () {
         p.timeout = true;
         decrement();
      }, this.config.bot_timeout);
   });
};

Match.prototype.tick_shells = function () {
   this.shells.forEach(function (s) {
      // Not quite fair if it's within two bots range 
      // who is it closest to would be a little better
      for (b in this.bots) {
         bot = this.bots[b];

         if (util.within_range(bot.position, s.position, config.bot_radius)) {
            bot.health -= s.power;
            s.is_dead = true;
            this.emit('bot_hit', bot);
            break;
         }
      }

      s.position = util.move(s.position, s.speed, s.heading);
   });

   // Clean up bots that died from damage
   this.bots.forEach(function (bot) {
      if (bot.health <= 0) {
         bot.death_ticks = ticks;
         this.emit('bot_died', bot);
      }
   });

   //Remove dead shells
   var len = this.shells.length
   while (len--) {   
      if (this.shells[len].is_dead) {
         this.shells.splice(len, 1);
      }
   }
};

Match.prototype.tick_commands = function (commands) {
   commands.forEach(function (c) {
      var bot = c.bot;
      var cmd = c.command;

      bot.heading = util.bound_heading(bot.heading, cmd.heading, config.max_heading_delta);
      bot.radar_heading = util.bound_heading(bot.heading, cmd.heading, config.max_heading_delta);
      bot.turret_heading = util.bound_heading(bot.heading, cmd.heading, config.max_heading_delta);
      bot.position = util.move(bot.position, bot.speed, bot.heading);
   });
};

Match.prototype.tick = function (done) {
   this.tick_shells();
   this.tick_radars();
   this.tick_bots((function (commands) {
      this.tick_commands(commands);
      this.tick_new_shells();
      this.ticks++;
      return done();
   }).bind(this));
};

Match.prototype.start = function (config) {
   if (this.is_started)
      return;

   this.initialize();

   var cb = (function () {
      // Check for game ending condition
      if (this.bots.length == 0 || this.bots.length == 1 || ticks == this.config.max_ticks) {
         return this.emit('ended', this.bots);
      }

      this.tick(cb);
   }).bind(this);

   this.emit('started'); 
   this.tick(cb);
};

module.exports = Match;