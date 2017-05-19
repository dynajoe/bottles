var EntityViewer = function (game_viewer) {
	this.game_viewer = game_viewer;
	this.body_texture = PIXI.Texture.fromImage("/images/body.png");
   this.radar_texture = PIXI.Texture.fromImage("/images/radar_new.png");
   this.turret_texture = PIXI.Texture.fromImage("/images/turret.png");
   this.shell_texture = PIXI.Texture.fromImage("/images/bullet.png");
	this.is_started = false;
   this.config = undefined;
   this.bots = {};
   this.shells = {};
};

EntityViewer.prototype.translate = function (pos, max) {
   return max - pos;
};

EntityViewer.prototype.add_health_bar = function (b, health) {
   if (b.health_bar)
      b.removeChild(b.health_bar);

   var graphics = new PIXI.Graphics();
   graphics.lineStyle(3, 0xFF0000);
   graphics.moveTo(-20, 25);
   graphics.lineTo(-20 + 40 * health, 25);

   b.addChild(graphics);
   b.health_bar = graphics;
};

EntityViewer.prototype.add_bot = function (b, config) {
   var bot = new PIXI.Sprite(this.body_texture);
   var turret = new PIXI.Sprite(this.turret_texture);
   var radar = new PIXI.Sprite(this.radar_texture);
   var flag = new PIXI.Text(b.name, {fill:'red'});

   bot.other_sprites = {
      turret: turret,
      radar: radar,
      flag: flag,
   };

   this.add_health_bar(bot, b.health / 100);

   var x = b.position.x;
   var y = this.translate(b.position.y, config.arena.height);

   bot.anchor.x = 0.5;
   bot.anchor.y = 0.5;

   turret.anchor.x = 0.5;
   turret.anchor.y = 0.5;

   radar.anchor.x = 0.5;
   radar.anchor.y = 0.5;

   flag.anchor.x = 0.5;
   flag.anchor.y = -.7;

   bot.position.x = x;
   bot.position.y = y;

   turret.position.x = x;
   turret.position.y = y;

   radar.position.x = x;
   radar.position.y = y;

   flag.position.x = x;
   flag.position.y = y;
   flag.height = bot.height;
   flag.width = bot.width;

   this.game_viewer.stage.addChild(bot);
   this.game_viewer.stage.addChild(turret);
   this.game_viewer.stage.addChild(radar);
   this.game_viewer.stage.addChild(flag);

   bot.name = b.name;
   bot.turret = turret;
   bot.radar = radar;
   bot.flag = flag;

   this.bots[b.name] = bot;
};


EntityViewer.prototype.add_shell = function (s, config) {
   var shell = new PIXI.Sprite(this.shell_texture);

   var x = s.position.x;
   var y = this.translate(s.position.y, config.arena.height);

   shell.anchor.x = 0.5;
   shell.anchor.y = 0.5;
   shell.position.x = x;
   shell.position.y = y;
   this.game_viewer.stage.addChild(shell);

   this.shells[s.id] = shell;
};

EntityViewer.prototype.remove_bot = function (bot) {
   var associatedSprites = bot.other_sprites;
   if(associatedSprites){
      for(var key in associatedSprites){
         this.game_viewer.stage.removeChild(associatedSprites[key])
         delete(associatedSprites[key])
      }
   }
   this.game_viewer.stage.removeChild(bot);
}

EntityViewer.prototype.start = function (data) {
   this.is_started = true;
   this.config = data.config;

   var bots = data.bots || [];
   for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      this.add_bot(b, data.config);
   }

   var shells = data.shells || [];
   for (var i = 0; i < shells.length; i++) {
      var s = shells[i];
      this.add_shell(s, data.config);
   }
};

EntityViewer.prototype.set_data = function (data) {
   if (!this.is_started) {
      this.start(data);
   }

   var live_bots = {};

   for (var i = 0; i < data.bots.length; i++) {
      var b = data.bots[i];
      var bot = this.bots[b.name];
      if (!bot) continue;

      var x = b.position.x;
      var y = this.translate(b.position.y, data.config.arena.height);

      this.add_health_bar(bot, b.health / 100);

      bot.position.x = x;
      bot.position.y = y;
      bot.turret.position.x = x;
      bot.turret.position.y = y;
      bot.radar.position.x = x;
      bot.radar.position.y = y;
      bot.flag.position.x = x;
      bot.flag.position.y = y;
      bot.rotation = b.heading;
      bot.radar.rotation = b.radar_heading;
      bot.turret.rotation = b.turret_heading;
      live_bots[b.name] = b;
   }

   var live_shells = {};
   for (var i = 0; i < data.shells.length; i++) {
      var s = data.shells[i];

      if (this.shells[s.id]) {
         var x = s.position.x;
         var y = this.translate(s.position.y, data.config.arena.height);

         this.shells[s.id].position.x = x;
         this.shells[s.id].position.y = y;
      }
      else {
         this.add_shell(s, data.config);
      }

      live_shells[s.id] = s;
   }

   for (var s in this.shells) {
      if (!live_shells[s]) {
         this.game_viewer.stage.removeChild(this.shells[s])
         delete this.shells[s];
      }
   }

   for (var b in this.bots) {
      if (!live_bots[b]) {
         this.remove_bot(this.bots[b]);
         delete this.bots[b];
      }
   }
};

