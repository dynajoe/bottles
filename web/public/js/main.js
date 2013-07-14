$(document).ready(function () {
   var socket = io.connect('/');
   var is_started = false;
   var config;
   var stage = new PIXI.Stage(0x000000);
   var renderer = PIXI.autoDetectRenderer(800, 600);
   window.bots = {};
   window.shells = {};

   document.body.appendChild(renderer.view);
   requestAnimFrame(animate);
   var translate = function (pos, max) {
      return max - pos;
   };

   var body_texture = PIXI.Texture.fromImage("/images/body.png");
   var radar_texture = PIXI.Texture.fromImage("/images/radar.png");
   var turret_texture = PIXI.Texture.fromImage("/images/turret.png");   
   var shell_texture = PIXI.Texture.fromImage("/images/bullet.png");

   function animate() {
       requestAnimFrame(animate);
       renderer.render(stage);
   };

   function addHealthBar(b, health) {
      if (b.health_bar)
         b.removeChild(b.health_bar);

      var graphics = new PIXI.Graphics();
      graphics.lineStyle(3, 0xFF0000); 
      graphics.moveTo(-20, 25);
      graphics.lineTo(-20 + 40 * health, 25);
      
      b.addChild(graphics);
      b.health_bar = graphics;
   };

   function addBot(b, config) {
      var bot = new PIXI.Sprite(body_texture);
      var turret = new PIXI.Sprite(turret_texture);
      var radar = new PIXI.Sprite(radar_texture);
      
      addHealthBar(bot, b.health / 100);
      
      var name = new PIXI.Text(b.name, {fill: 'red'});

      bot.addChild(name);
      
      var x = translate(b.position.x, config.arena.width);
      var y = translate(b.position.y, config.arena.height);
   
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

      stage.addChild(bot);
      stage.addChild(turret);
      stage.addChild(radar);

      bot.name = b.name;
      bots[b.name] = bot;
      bot.turret = turret;
      bot.radar = radar;
   };
   
   function addShell(s, config) {
      var shell = new PIXI.Sprite(shell_texture);

      var x = translate(s.position.x, config.arena.width);
      var y = translate(s.position.y, config.arena.height);
   
      shell.anchor.x = 0.5;
      shell.anchor.y = 0.5;
      shell.position.x = x;
      shell.position.y = y;
      stage.addChild(shell);
      shells[s.name] = shell;
   };

   socket.on('start', function (data) {
      if (!is_started) {
         start(data);
      }
   });

   socket.on('tick', function (data) {
      if (!is_started) {
         start(data);
      }

      var live_bots = {};
      for (var i = 0; i < data.bots.length; i++) {
         var b = data.bots[i];
         var bot = bots[b.name];
         var x = translate(b.position.x, data.config.arena.width);
         var y = translate(b.position.y, data.config.arena.height);
         
         addHealthBar(bot, b.health / 100);
      
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
         
         if (shells[s.name]) {
            var x = translate(s.position.x, data.config.arena.width);
            var y = translate(s.position.y, data.config.arena.height);
         
            shells[s.name].position.x = x;
            shells[s.name].position.y = y;
         }
         else {
            addShell(s, data.config);
         }   

         live_shells[s.name] = s;
      }

      for (var s in shells) {
         if (!live_shells[s]) {
            stage.removeChild(shells[s])
            delete shells[s];
         }
      }

      for (var b in bots) {
         if (!live_bots[b]) {
            stage.removeChild(bots[b])
            delete bots[b];
         }
      }
   });

   var start = function (data) {
      is_started = true;

      for (var i = 0; i < data.bots.length; i++) {
         var b = data.bots[i];
         addBot(b, data.config);
      }

      for (var i = 0; i < data.shells.length; i++) {
         var s = data.shells[i];
         addShell(s, data.config);
      }
      
      config = data.config;
   };
});
