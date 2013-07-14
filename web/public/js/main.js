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

   var body_texture = PIXI.Texture.fromImage("/images/body.png");
   var radar_texture = PIXI.Texture.fromImage("/images/radar.png");
   var turret_texture = PIXI.Texture.fromImage("/images/turret.png");   
   var shell_texture = PIXI.Texture.fromImage("/images/bullet.png");

   function animate() {
       requestAnimFrame(animate);
       renderer.render(stage);
   };
   
   function addShell(s) {
      var shell = new PIXI.Sprite(shell_texture);
      shell.anchor.x = 0.5;
      shell.anchor.y = 0.5;
      shell.position.x = s.position.x;
      shell.position.y = s.position.y;
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
         bots[b.name].position.x = b.position.x;
         bots[b.name].position.y = b.position.y;
         live_bots[b.name] = b;
      }


      var live_shells = {};
      for (var i = 0; i < data.shells.length; i++) {
         var s = data.shells[i];
         
         if (shells[s.name]) {
            shells[s.name].position.x = s.position.x;
            shells[s.name].position.y = s.position.y;   
         }
         else {
            addShell(s);
         }   

         live_shells[s.name] = s;
      }

      for (var s in shells) {
         if (!live_shells[s]) {
            //stage.removeChild(shells[s])
            //delete shells[s];
         }
      }

      for (var b in bots) {
         if (!live_bots[b]) {
            //stage.removeChild(bots[b])
            //delete bots[b];
         }
      }
   });

   var start = function (data) {
      is_started = true;

      for (var i = 0; i < data.bots.length; i++) {
         var b = data.bots[i];
         var bot = new PIXI.Sprite(body_texture);
         bot.anchor.x = 0.5;
         bot.anchor.y = 0.5;
         bot.position.x = b.position.x;
         bot.position.y = b.position.y;
         bot.name = b.name;

         stage.addChild(bot);
         bots[b.name] = bot;
      }

      for (var i = 0; i < data.shells.length; i++) {
         var s = data.shells[i];
         addShell(s);
      }
      
      config = data.config;
   };
});
