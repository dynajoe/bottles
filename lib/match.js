'use strict';
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
      max_bot_energy: 10,
      bot_timeout: 500
   };

   this.config = node_util._extend(defaults, config);
   
   var bot_radius = this.config.bot_radius;
   var arena = this.config.arena;

   this.bot_bounds = { 
      min: { x: bot_radius, y: bot_radius }, 
      max: { x: arena.width - bot_radius, y: arena.height - bot_radius }
   };

   this.is_started = false;
   this.is_stopped = false;
   this.bots = [];
   this.brains = {};
   this.shells = [];
   this.ticks = 0;
   this.total_shell_count = 0;
   this.headings = ['turret_heading', 'radar_heading', 'heading'];
   this.id = util.generate_id();
};

node_util.inherits(Match, EventEmitter);

Match.prototype.add_bot = function (bot) {
   if (!this.is_started) {
      var bot_id = util.generate_id();
      this.bots.push({ id: bot_id, name: bot.name });  
      this.brains[bot_id] = bot;
      this.emit('bot_entered', bot.name); 
   }
};

Match.prototype.random_between = function (a, b) {
   return (b - a) * util.random(this.seed) + a;
};

Match.prototype.random_angle = function () {
   return util.random_angle(this.seed);
};

Match.prototype.update_radars = function () {
   var bot_count = this.bots.length;
   for (var i = 0; i < bot_count; i++) {
      var b1 = this.bots[i];
      b1.radar = [];
      b1.radar_heading = util.normalize_radians(b1.radar_heading);
      
      if (b1.health <= 0) continue;

      for (var j = 0; j < bot_count; j++) {
         if (i === j) continue;

         var b2 = this.bots[j];

         if (b2.health <= 0) continue;

         var delta = util.heading_delta_between_points(b1.position, b1.radar_heading, b2.position);

         if (util.is_between(delta, -this.config.radar_vision / 2, this.config.radar_vision / 2)) {
            var distance = util.distance(b1.position, b2.position);
            var heading = util.heading_between_points(b1.position, b2.position);

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
   this.shells = [];
   this.ticks = 0;
   this.total_shell_count = 0;
   
   this.bots.forEach(function (b) {
    
      var pos = { 
         x: util.round(this.random_between(this.bot_bounds.min.x, this.bot_bounds.max.x)), 
         y: util.round(this.random_between(this.bot_bounds.min.y, this.bot_bounds.max.y))
      };

      b.name = b.name;
      b.position = pos;      
      b.heading = this.random_angle();
      b.turret_heading = b.heading;
      b.radar_heading = b.heading;
      b.fire_power = 0;
      b.speed = 0;
      b.health = this.config.max_bot_health;
      b.energy = this.config.max_bot_energy;
   }, this);
};

Match.prototype.tick_bots = function (done) {
   this.update_radars();

   var commands = [];
   var waitCount = this.bots.length;

   var decrement = function () {
      waitCount--;
      if (waitCount === 0) done(commands);
   };

   this.bots.forEach(function (bot) {
      if (bot.health <= 0) return;

      bot.timed_out = false;

      var timeout = setTimeout(function () {
         bot.timed_out = true;
         decrement();
      }, this.config.bot_timeout);

      //Ensure this is asynchronous in order to let setTimeout tick
      setTimeout(function () {
         this.brains[bot.id].tick({
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
      }.bind(this), 0);
   }, this);
};

Match.prototype.tick_shells = function () {
   //Remove dead shells from previous round
   var len = this.shells.length;
   while (len--) {   
      if (this.shells[len].is_dead) {
         this.shells.splice(len, 1);
      }
   }
   
   var shell_collisions = [];

   this.shells.forEach(function (s) {
      if (!util.is_within_rect(s.position, this.config.arena)) {
         s.is_dead = true;
         return;
      }

      // Not quite fair if it's within two bots range 
      // who is it closest to would be a little better
      for (var b in this.bots) {
         var bot = this.bots[b];
         var is_hit = false;
         
         if (!s.previous_position) {
            is_hit = util.is_within_range(bot.position, s.position, this.config.bot_radius);
         } else {
            is_hit = util.detect_collision(s.position, s.previous_position, bot.position, this.config.bot_radius);
         }

         if (bot.name !== s.owner && is_hit) {
            bot.health -= s.fire_power;
            s.is_dead = true;
            shell_collisions.push({ x: s.position.x, y: s.position.y });
            this.emit('bot_hit', bot);
            break;
         }
      }

      s.previous_position = s.position;
      s.position = util.move(s.position, s.heading, s.speed);
   }, this);

   var bot_index = this.bots.length;
   while (bot_index--) {   
      var bot = this.bots[bot_index];
      if (bot.health <= 0) {
         bot.death_ticks = this.ticks;
         this.bots.splice(bot_index, 1);
         this.emit('bot_died', bot);
      }
   }
};

Match.prototype.tick_commands = function (commands) {
   commands.forEach(function (c) {
      var bot = c.bot;
      var cmd = c.command || {};

      this.headings.forEach(function (h) {
         if (util.is_number(cmd[h]))
            bot[h] = util.bound_heading(bot[h], cmd[h], this.config.max_heading_delta);
      }, this);

      if (util.is_number(cmd.fire_power))
         bot.fire_power = cmd.fire_power;
      
      if (util.is_number(cmd.speed))
         bot.speed = cmd.speed;
      
      if (bot.speed) {
         bot.position = util.move(bot.position, bot.heading, bot.speed);
         bot.position = util.ensure_bounds(bot.position, this.bot_bounds);
      }

      if (bot.fire_power > 0 && bot.energy > 0) {
         var energy_loss = Math.pow(bot.fire_power, this.config.shell_ratio) * this.config.gun_energy_factor;

         bot.energy -= energy_loss;

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
      
      bot.energy = Math.min(this.config.max_bot_energy, ++bot.energy);
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

Match.prototype.is_game_over = function () {
   if (this.is_stopped)
      this.end_reason = 'stopped';
   else if (this.bots.length === 0) 
      this.end_reason = 'no bots';
   else if (this.bots.length === 1)
      this.end_reason = 'last bot standing';
   else if (this.config.max_ticks !== 0 && this.ticks > this.config.max_ticks)
      this.end_reason = 'max ticks';

   return !!this.end_reason;
};

Match.prototype.clone = function () {
   var m = new Match(this.config);
   for (var id in this.brains) {
      m.add_bot(this.brains[id]);
   }
   return m;
};

Match.prototype.stop = function () {
   this.is_stopped = true;
};

Match.prototype.start = function () {
   if (this.is_started)
      return;

   this.initialize();

   process.nextTick(function () {
      var cb = function () {
         if (this.is_game_over()) 
            return this.emit('end', { reason: this.end_reason, ticks: this.ticks, bots: this.bots });

         this.emit('tick', { ticks: this.ticks, bots: this.bots, shells: this.shells, config: this.config }); 
         this.tick(cb);
      }.bind(this);
      this.emit('start', { ticks: this.ticks, bots: this.bots, shells: this.shells, config: this.config }); 
      this.tick(cb);
   }.bind(this));
};

module.exports = Match;