var GameViewer = function () {
   var stage = this.stage = new PIXI.Stage(0x000000);
   var renderer = this.renderer = PIXI.autoDetectRenderer(400, 300);

   this.view = renderer.view;
   
   var self = this;   
   
   function animate () {
       requestAnimFrame(animate);
       renderer.render(self.stage);
   };

   requestAnimFrame(animate);
};

GameViewer.prototype.clear = function () {
   this.stage = new PIXI.Stage(0x000000);
   
   Log('stage cleared');
};
