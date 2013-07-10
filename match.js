var EventEmitter = require('events').EventEmitter;

var Match = function () {
   this.config = null;
   this.is_started = false;
   this.bots = [];
};

Match.prototype = new EventEmitter;

Match.prototype.addBot = function (bot) {
   if (!this.is_started) {
      this.bots.push(bot);  
      this.emit('bot_joined', bot.name); 
   }
};

Match.prototype.random = function () {
   return Math.random();
};

Match.prototype.process = function (commands) {

   commands.forEach(function (c) {
      commands.

   });

};

/*
   config:
      max_ticks: infinite
      max_bot_health: 100
      seed: random
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