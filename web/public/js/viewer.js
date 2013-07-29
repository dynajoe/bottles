var GameViewer = function () {
   var stage = this.stage = new PIXI.Stage(0x000000);
   var renderer = this.renderer = PIXI.autoDetectRenderer(400, 300);
   
   this.view = renderer.view;
   this.is_started = false;
   this.config = undefined;
   this.bots = {};
   this.shells = {};

   this.body_texture = PIXI.Texture.fromImage("/images/body.png");
   this.radar_texture = PIXI.Texture.fromImage("/images/radar_new.png");
   this.turret_texture = PIXI.Texture.fromImage("/images/turret.png");   
   this.shell_texture = PIXI.Texture.fromImage("/images/bullet.png");

   function animate () {
       requestAnimFrame(animate);
       renderer.render(stage);
   };

   requestAnimFrame(animate);
};

GameViewer.prototype.translate = function (pos, max) {
   return max - pos;
};

GameViewer.prototype.add_health_bar = function (b, health) {
   if (b.health_bar)
      b.removeChild(b.health_bar);

   var graphics = new PIXI.Graphics();
   graphics.lineStyle(3, 0xFF0000); 
   graphics.moveTo(-20, 25);
   graphics.lineTo(-20 + 40 * health, 25);
   
   b.addChild(graphics);
   b.health_bar = graphics;
};

GameViewer.prototype.add_bot = function (b, config) {
   var bot = new PIXI.Sprite(this.body_texture);
   var turret = new PIXI.Sprite(this.turret_texture);
   var radar = new PIXI.Sprite(this.radar_texture);
   
   this.add_health_bar(bot, b.health / 100);
   
   var name = new PIXI.Text(b.name, {fill: 'white', align: "center", font: 'bold 35px Verdana', stroke: 'red', strokeThickness: 6});
   name.anchor.x = 0.5;
   name.position.y = 25;
   bot.addChild(name);

   
   var x = b.position.x;;
   var y = this.translate(b.position.y, config.arena.height);

   bot.anchor.x = 0.5;
   bot.anchor.y = 0.5;

   turret.anchor.x = 0.5;
   turret.anchor.y = 0.5;

   radar.anchor.x = 0.5;
   radar.anchor.y = 0.5;

   bot.position.x = x;
   bot.position.y = y;

   turret.position.x = x;
   turret.position.y = y;

   radar.position.x = x;
   radar.position.y = y;

   this.stage.addChild(bot);
   this.stage.addChild(turret);
   this.stage.addChild(radar);

   bot.name = b.name;
   bot.turret = turret;
   bot.radar = radar;

   this.bots[b.name] = bot;
};

GameViewer.prototype.add_shell = function (s, config) {
   var shell = new PIXI.Sprite(this.shell_texture);

   var x = s.position.x;
   var y = this.translate(s.position.y, config.arena.height);

   shell.anchor.x = 0.5;
   shell.anchor.y = 0.5;
   shell.position.x = x;
   shell.position.y = y;
   this.stage.addChild(shell);

   this.shells[s.name] = shell;
};

GameViewer.prototype.set_data = function (data) {
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
      bot.rotation = b.heading;
      bot.radar.rotation = b.radar_heading;
      bot.turret.rotation = b.turret_heading;
      live_bots[b.name] = b;
   }

   var live_shells = {};
   for (var i = 0; i < data.shells.length; i++) {
      var s = data.shells[i];
      
      if (this.shells[s.name]) {
         var x = s.position.x;
         var y = this.translate(s.position.y, data.config.arena.height);
      
         this.shells[s.name].position.x = x;
         this.shells[s.name].position.y = y;
      }
      else {
         this.add_shell(s, data.config);
      }   

      live_shells[s.name] = s;
   }

   for (var s in this.shells) {
      if (!live_shells[s]) {
         this.stage.removeChild(this.shells[s])
         delete this.shells[s];
      }
   }

   for (var b in this.bots) {
      if (!live_bots[b]) {
         this.stage.removeChild(this.bots[b])
         delete this.bots[b];
      }
   }
};
      
GameViewer.prototype.start = function (data) {
   this.is_started = true;

   for (var i = 0; i < data.bots.length; i++) {
      var b = data.bots[i];
      this.add_bot(b, data.config);
   }

   for (var i = 0; i < data.shells.length; i++) {
      var s = data.shells[i];
      this.add_shell(s, data.config);
   }
   
   this.config = data.config;
};
