var EventEmitter = require('events').EventEmitter;
var util = require('./util');

var Match = function () {
   this.config = null;
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

Match.prototype.randomAngle = function () {
   return util.randomAngle(this.seed);
};

Match.prototype.process = function (commands) {

   //Process shells
   this.shells.forEach(function (s) {
      s.position = util.move(s.position, s.speed, s.heading);

      // Not quite fair if it's within two bots range 
      // who is it closest to would be a little better
      for (b in this.bots) {
         bot = this.bots[b];

         if (util.within_range(bot.position, s.position, config.bot_radius)) {
            bot.health -= s.power;
            s.is_dead = true;
            break;
         }
      });
   });

   //Remove dead shells
   var len = this.shells.length
   while (len--) {   
      if (this.shells[len].is_dead) {
         this.shells.splice(len, 1);
      }
   }

   //Update positions
   commands.forEach(function (c) {
      var bot = c.bot;
      var cmd = c.command;

      bot.heading = util.bound(bot.heading, cmd.heading, config.max_heading_delta);
      bot.radar_heading = util.bound(bot.heading, cmd.heading, config.max_heading_delta);
      bot.turret_heading = util.bound(bot.heading, cmd.heading, config.max_heading_delta);
      bot.position = util.move(bot.position, bot.speed, bot.heading);
   });

   //Update the radars

};

/*
   config:
      max_ticks: infinite
      max_bot_health: 100
      seed: random
      bot_radius: 20
      max_heading_delta: 1.5 degrees in radians
      arena: 
         width: 1200
         height: 700
*/
Match.prototype.start = function (config) {
   if (this.is_started)
      return;

   this.config = config;
   this.is_started = true;
   
   // Assign random location, heading, radar_heading, and turret_heading to start
   this.bots.forEach(function (b) {
      b.position = { x: this.random() * config.arena.width, y: this.random() * config.arena.height };
      b.heading = this.randomAngle();
      b.turret_heading = this.randomAngle();
      b.radar_heading = this.randomAngle();
      b.fire = 0;
      b.speed = 0;
      b.ticks = 0;
      b.health = config.max_bot_health;
   });

   var winner = null;
   var ticks = 0;

   var tick = (function () {
      var living_bots = [];

      this.bots.forEach(function (p) {
         if (p.health > 0) {
            living_bots.push(p);
         } else {
            p.death_ticks = ticks;
            this.emit('bot_died', p);
         }
      });
      
      ticks++;
      
      // Check for game ending condition
      if (living_bots.length == 0 || living_bots.length == 1 || ticks == this.config.max_ticks) {
         return this.emit('ended', living_bots, this.bots);
      }

      var commands = [];
      var waitCount = living_bots.length;

      var done = (function () {
         this.process(commands, living_bots);
         this.emit('tick', living_bots);
         setTimeout(tick, 1);   
      }).bind(this);

      var decrement = function () {
         waitCount--;
         if (waitCount == 0) done();
      };

      living_bots.forEach(function (p) {
         if (p.health <= 0) return;

         p.timeout = false;

         p.tick(function (command) {
            if (p.timeout)
               return;

            commands.push({ bot: p, command: command });
            decrement();
         });

         setTimeout(function () {
            p.timeout = true;
            decrement();
         }), 500);
      });
   }).bind(this);  
   
   this.emit('started'); 
   
   tick();    
};

module.exports = Match;