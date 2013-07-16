var EventEmitter = require('events').EventEmitter;
var util = require('./util');
var node_util = require('util');

var Match = function (config) {
   var defaults = {
      max_ticks: 0,
      max_bot_health: 100,
      bot_radius: 19,
      radar_vision: util.ONE_DEGREE * 20,
      max_heading_delta: util.ONE_DEGREE * 1.5,
      shell_ratio: 1.5,
      shell_speed_factor: 4.5,
      gun_energy_factor: 10,
      arena: {
         width: 800,
         height: 600 
      },
      turret_length: 23,
      max_gun_energy: 10,
      bot_timeout: 500
   };

   this.config = node_util._extend(defaults, config);
   this.is_started = false;
   this.bots = [];
   this.shells = [];
   this.ticks = 0;
   this.total_shell_count = 0;
};

Match.prototype = new EventEmitter;

Match.prototype.add_bot = function (bot) {
   if (!this.is_started) {
      this.bots.push({ name: bot.name, brain: bot });  
      this.emit('bot_entered', bot.name); 
   }
};

Match.prototype.random = function (value) {
   return util.random(this.seed) * value;
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

         var heading = util.normalize_radians(util.heading(b1.position, b2.position));
         var distance = util.distance(b1.position, b2.position);
         if (util.is_within_radians(b1.radar_heading, heading, this.config.radar_vision)) {
            b1.radar.push({ 
               name: b2.name, 
               distance: distance, 
               heading: heading
            });
         }
      }    
   }
};

Match.prototype.initialize = function () {
   this.is_started = true;

   this.bots.forEach(function (b) {
      b.position = { x: this.random(this.config.arena.width), y: this.random(this.config.arena.height) };      
      b.heading = this.random_angle();
      b.turret_heading = b.heading;
      b.radar_heading = b.heading;
      b.fire_power = 0;
      b.speed = 0;
      b.ticks = 0;
      b.health = this.config.max_bot_health;
      b.energy = 500;
      b.name = b.name;
   }, this);
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

      bot.timed_out = false;

      var timeout = setTimeout(function () {
         bot.timed_out = true;
         decrement();
      }, this.config.bot_timeout);

      //Ensure this is asynchronous in order to let setTimeout tick
      setTimeout((function () {
         bot.brain.tick({
            heading: bot.heading,
            turret_heading: bot.turret_heading,
            radar_heading: util.normalize_radians(bot.radar_heading),
            position: { x: bot.position.x, y: bot.position.y },
            speed: bot.speed,
            fire_power: bot.fire_power,
            radar: bot.radar,
            ticks: this.ticks
         }, function (command) {
            clearTimeout(timeout);

            if (bot.timed_out)
               return;

            commands.push({ bot: bot, command: command });
            decrement();
         });
      }).bind(this), 0);
   }, this);
};

Match.prototype.tick_shells = function () {
   this.shells.forEach(function (s) {
      
      if (!util.is_within_rect(s.position, this.config.arena)) {
         s.is_dead = true;
         return;
      }

      // Not quite fair if it's within two bots range 
      // who is it closest to would be a little better
      for (b in this.bots) {
         bot = this.bots[b];

         if (bot.name != s.owner.name && util.is_within_range(bot.position, s.position, this.config.bot_radius)) {
            bot.health -= s.fire_power;
            s.is_dead = true;
            this.emit('bot_hit', bot);
            break;
         }
      }
      s.position = util.move(s.position, s.heading, s.speed);
   }, this);

   // Clean up bots that died from damage
   this.bots.forEach(function (bot) {
      if (bot.health <= 0) {
         bot.death_ticks = ticks;
         this.emit('bot_died', bot);
      }
   }, this);

   //Remove dead shells
   var len = this.shells.length;
   while (len--) {   
      if (this.shells[len].is_dead) {
         this.shells.splice(len, 1);
      }
   }
};

Match.prototype.tick_commands = function (commands) {
   commands.forEach(function (c) {
      var bot = c.bot;
      var cmd = c.command || {};

      if (util.is_number(cmd.heading))
         bot.heading = util.bound_heading(bot.heading, cmd.heading, this.config.max_heading_delta);
  
      if (util.is_number(cmd.radar_heading))
         bot.radar_heading = util.bound_heading(bot.radar_heading, cmd.radar_heading, this.config.max_heading_delta);
  
      if (util.is_number(cmd.turret_heading))
         bot.turret_heading = util.bound_heading(bot.turret_heading, cmd.turret_heading, this.config.max_heading_delta);

      bot.fire_power = cmd.fire_power || 0;
      bot.speed = cmd.speed || 0;
      
      if (bot.speed)
         bot.position = util.move(bot.position, bot.heading, bot.speed, this.config.arena);

      if (bot.fire_power > 0 && bot.energy > 0) {
         var energy_loss = Math.pow(bot.fire_power, this.config.shell_ratio) * this.config.gun_energy_factor;

         bot.energy -= energy_loss;
         //Originate from the middle of the bot?
         var shell = { 
            position: util.move(bot.position, bot.turret_heading, this.config.turret_length),
            fire_power: bot.fire_power, 
            heading: bot.turret_heading, 
            speed: bot.fire_power * this.config.shell_speed_factor, 
            name: this.total_shell_count++,
            owner: bot.name
         };

         this.shells.push(shell);
      } else {
         bot.fire_power = 0;
      }
      
      bot.energy = Math.min(this.config.max_gun_energy, ++bot.energy);
   }, this);
};

Match.prototype.tick = function (done) {
   this.tick_shells();
   this.tick_bots(function (commands) {
      this.tick_commands(commands);
      this.ticks++;
      return done();
   }.bind(this));
};

Match.prototype.start = function (config) {
   if (this.is_started)
      return;

   this.initialize();

   process.nextTick((function () {
      var cb = (function () {
         // Check for game ending condition
         if (this.bots.length == 0 || this.bots.length == 1 || (this.config.max_ticks != 0 && this.ticks > this.config.max_ticks)) {
            return this.emit('end', this.bots);
         }

         this.emit('tick', { ticks: this.ticks, bots: this.bots, shells: this.shells, config: this.config }); 
         this.tick(cb);
      }).bind(this);

      this.emit('start', {ticks: this.ticks, bots: this.bots, config: this.config }); 
      this.tick(cb);
   }).bind(this));
};

module.exports = Match;