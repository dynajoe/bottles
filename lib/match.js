'use strict';
var EventEmitter = require('events').EventEmitter;
var util = require('./util');
var node_util = require('util');
var async = require('async');

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
      max_bot_speed: 5,
      max_fire_power: 5,
      arena: {
         width: 800,
         height: 600 
      },
      turret_length: 23,
      max_bot_energy: 10,
      bot_timeout: 300,
      bot_timeout_health_loss: 5,
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
   this.bots_by_id = {};
   this.brains = {};
   this.shells = [];
   this.ticks = 0;
   this.total_shell_count = 0;
   this.headings = ['turret_heading', 'radar_heading', 'heading'];
   this.id = util.generate_id();
   this.random_generator = util.new_random_generator(this.config.seed);
};

node_util.inherits(Match, EventEmitter);

Match.prototype.add_bot = function (bot) {
   if (!this.is_started) {
      var bot_id = util.generate_id();
      var new_bot = { id: bot_id, name: bot.name };
      this.bots.push(new_bot); 
      this.bots_by_id[bot_id] = new_bot;
      this.brains[bot_id] = bot;
      this.emit('bot_entered', { id: bot_id, name: bot.name }); 
   }
};

Match.prototype.random_between = function (a, b) {
   return (b - a) * this.random_generator.random() + a;
};

Match.prototype.random_angle = function () {
   return this.random_generator.random() * util.FULL_ANGLE;
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
      b.id = b.id;
      b.position = pos;      
      b.heading = this.random_angle();
      b.turret_heading = b.heading;
      b.radar_heading = b.heading;
      b.fire_power = 0;
      b.speed = 0;
      b.health = this.config.max_bot_health;
      b.energy = this.config.max_bot_energy;
      b.total_shells = 0;
      b.total_tick_time = 0;
      b.total_hits = 0;
      b.timeouts = 0;
   }, this);
};

Match.prototype.create_sensors = function (bot) {
   return {
      heading: bot.heading,
      turret_heading: bot.turret_heading,
      radar_heading: util.normalize_radians(bot.radar_heading),
      position: { x: bot.position.x, y: bot.position.y },
      speed: bot.speed,
      fire_power: bot.fire_power,
      radar: bot.radar,
      ticks: this.ticks
   };
};

Match.prototype.tick_brain = function (brain, bot, sensors, cb) {
   var tick_requested_at = new Date();
   var match = this;

   var timeout_handle = setTimeout(function () {
      tick_done(true);
   }, match.config.bot_timeout);

   var tick_done = function (timed_out, command) {
      if (!timeout_handle)
         return;

      timeout_handle = clearTimeout(timeout_handle);

      bot.total_tick_time += new Date().getTime() - tick_requested_at.getTime();
      
      if (timed_out) { 
         bot.timeouts++; 
         bot.health -= match.config.bot_timeout_health_loss;                  
         brain.timed_out(sensors.ticks);
         command = {};

         if (bot.health <= 0) {
            match.kill_bot(bot);    
         }
      }

      cb(null, { bot: bot, command: command });
   };

   brain.tick(sensors, function (command) {
      tick_done(false, command || {});
   });
};

Match.prototype.tick_bots = function (done) {
   var brains_to_tick = [];
   var match = this;
   
   var add_brain_tick = function (bot) {
      var brain = match.brains[bot.id];
      var sensors = match.create_sensors(bot);

      brains_to_tick.push(function (cb) {
         match.tick_brain.call(match, brain, bot, sensors, cb);
      });
   };

   setImmediate(function () {
      for (var i = 0; i < match.bots.length; i++) {
         add_brain_tick(match.bots[i]);
      }

      async.parallel(brains_to_tick, function (err, commands) {
         done(commands);
      });
   });
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
         var is_hit = util.detect_collision(s.previous_position || s.position, s.position, bot.position, this.config.bot_radius);

         if (bot.id !== s.owner && is_hit) {
            bot.health -= s.fire_power;
            s.is_dead = true;
            shell_collisions.push({ x: s.position.x, y: s.position.y });
            this.bots_by_id[s.owner].total_hits++;
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
         this.kill_bot_by_index(bot_index);
      }
   }
};

Match.prototype.kill_bot = function (bot) {
   for (var i = 0; i < this.bots.length; i++) {
      var b = this.bots[i];
      
      if (b === bot) { 
         return this.kill_bot_by_index(i);
      }
   }   
};

Match.prototype.kill_bot_by_index = function (index) {
   var bot = this.bots[index];
   this.bots.splice(index, 1);
   bot.death_ticks = this.ticks;
   this.emit('bot_died', bot);
};

Match.prototype.tick_command = function (bot, cmd) {
   for (var i = 0; i < this.headings.length; i++) {
      var h = this.headings[i];
      if (util.is_number(cmd[h]))
         bot[h] = util.bound_heading(bot[h], cmd[h], this.config.max_heading_delta);
   }

   if (util.is_number(cmd.fire_power))
      bot.fire_power = util.bound_int(cmd.fire_power, 0, this.config.max_fire_power);
   
   if (util.is_number(cmd.speed))
      bot.speed = util.bound_number(cmd.speed, -cmd.speed, this.config.max_bot_speed);
   
   if (bot.speed) {
      bot.position = util.move(bot.position, bot.heading, bot.speed);
      bot.position = util.ensure_bounds(bot.position, this.bot_bounds);
   }

   if (bot.fire_power > 0 && bot.energy > 0) {
      bot.energy -= Math.pow(bot.fire_power, this.config.shell_ratio) * this.config.gun_energy_factor;
      bot.total_shells++;

      var position = util.move(bot.position, bot.turret_heading, this.config.turret_length);
      var speed = bot.fire_power * this.config.shell_speed_factor;

      this.add_shell(bot.id, position, speed, bot.turret_heading, bot.fire_power);      
   } else {
      bot.fire_power = 0;
   }
   
   bot.energy = Math.min(this.config.max_bot_energy, ++bot.energy);
};

Match.prototype.add_shell = function (owner_id, position, speed, heading, power) {
   this.shells.push({
      id: this.total_shell_count++,
      position: position,
      fire_power: power,
      heading: heading,
      speed: speed,
      owner: owner_id
   });
};

Match.prototype.tick_commands = function (commands) {
   var match = this;

   for (var i = 0; i < commands.length; i++) {
      match.tick_command.call(match, commands[i].bot, commands[i].command);
   }
};

Match.prototype.tick = function () {
   if (this.is_game_over()) 
      return this.emit('end', { reason: this.end_reason, ticks: this.ticks, bots: this.bots });

   this.emit('tick', { ticks: this.ticks, bots: this.bots, shells: this.shells, config: this.config }); 

   setImmediate(function () {   
      this.tick_shells();
      this.update_radars();
      this.tick_bots(function (commands) {
         this.tick_commands(commands);
         this.ticks++;
         return this.tick();
      }.bind(this));
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
      this.emit('start', { ticks: this.ticks, bots: this.bots, shells: this.shells, config: this.config }); 
      this.tick();
   }.bind(this));
};

module.exports = Match;