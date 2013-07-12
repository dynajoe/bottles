$(document).ready(function () {
   var socket = io.connect('/');
   var is_started = false;
   var config;
   var stage = new PIXI.Stage(0x000000);
   var renderer = PIXI.autoDetectRenderer(800, 600);
   window.bots = [];
   document.body.appendChild(renderer.view);
   requestAnimFrame(animate);
   var texture = PIXI.Texture.fromImage("/images/body.png");

   function animate() {
       requestAnimFrame(animate);
       renderer.render(stage);
   }

   socket.on('start', function (data) {
      if (!is_started) {
         start(data);
      }
   });

   socket.on('tick', function (data) {
      if (!is_started) {
         start(data);
      }

      for (var i = 0; i < data.bots.length; i++) {
         var b = data.bots[i];
         bots[b.name].position.x = b.position.x;
         bots[b.name].position.y = b.position.y;
      }

   });

   var start = function (data) {
      is_started = true;

      for (var i = 0; i < data.bots.length; i++) {
         var b = data.bots[i];
         var bot = new PIXI.Sprite(texture);
         bot.anchor.x = 0.5;
         bot.anchor.y = 0.5;
         bot.position.x = b.position.x;
         bot.position.y = b.position.y;
         bot.name = b.name;
         stage.addChild(bot);
         bots[b.name] = bot;
      }
      
      config = data.config;
   };
});
