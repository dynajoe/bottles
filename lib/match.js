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

Match.prototype.add_bot = function (bot) {
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

      for (var j = 0; j < this.bots.length; j++) {
         var b2 = this.bots[j];

         if (b1 == b2 || b1.health <= 0 || b2.health <= 0) continue;

         var heading = util.heading(b1.position, b2.position);
         
         if (util.is_within_radians(b1.radar_heading, heading, this.config.radar_vision)) {
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

   this.bots.forEach((function (b) {
      b.position = { x: this.random() * this.config.arena.width, y: this.random() * this.config.arena.height };      
      b.heading = this.random_angle();
      b.turret_heading = b.heading;
      b.radar_heading = b.heading;
      b.fire_power = 0;
      b.speed = 0;
      b.ticks = 0;
      b.health = this.config.max_bot_health;
      b.energy = 5;
   }).bind(this));
};

Match.prototype.tick_bots = function (done) {
   this.update_radars();

   var commands = [];
   var waitCount = this.bots.length;

   var decrement = function () {
      waitCount--;
      if (waitCount == 0) done(commands);
   };

   this.bots.forEach((function (bot) {
      if (bot.health <= 0) return;

      bot.timeout = false;

      var timeout = setTimeout(function () {
         bot.timeout = true;
         decrement();
      }, this.config.bot_timeout);

      //Ensure this is asynchronous in order to let setTimeout tick
      setTimeout(function (){
         bot.tick(function (command) {
            clearTimeout(timeout);

            if (bot.timeout)
               return;
            commands.push({ bot: bot, command: command });
            decrement();
         });
      }, 0);
   }).bind(this));
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
   commands.forEach((function (c) {
      var bot = c.bot;
      var cmd = c.command;

      bot.heading = util.bound_heading(bot.heading, cmd.heading, this.config.max_heading_delta);
      bot.radar_heading = util.bound_heading(bot.radar_heading, cmd.radar_heading, this.config.max_heading_delta);
      bot.turret_heading = util.bound_heading(bot.turret_heading, cmd.turret_heading, this.config.max_heading_delta);
      bot.position = util.move(bot.position, bot.heading, bot.speed);

      if (bot.fire_power > 0 && bot.energy > 0) {
         bot.energy -= Math.pow(bot.fire_power, this.config.shell_ratio) * this.config.gun_energy_factor;
         //Originate from the middle of the bot?
         this.shells.push({ x: bot.x, y: bot.y, heading: bot.turret_heading, speed: bot.fire_power });
      } else {
         bot.fire_power = 0;
      }

      bot.energy = Math.min(this.config.max_gun_energy, bot.energy++);
   }).bind(this));
};

Match.prototype.tick = function (done) {
   this.tick_shells();
   this.tick_bots((function (commands) {
      this.tick_commands(commands);
      this.ticks++;
      return done();
   }).bind(this));
};

Match.prototype.start = function (config) {
   if (this.is_started)
      return;

   this.initialize();

   process.nextTick((function () {
      var cb = (function () {
         // Check for game ending condition
         if (this.bots.length == 0 || this.bots.length == 1 || this.ticks == this.config.max_ticks) {
            return this.emit('ended', this.bots);
         }

         this.emit('tick', { ticks: this.ticks, bots: this.bots, shells: this.shells }); 
         this.tick(cb);
      }).bind(this);

      this.emit('started'); 
      this.tick(cb);
   }).bind(this));
};

module.exports = Match;