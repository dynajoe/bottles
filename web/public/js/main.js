$(document).ready(function () {
   var socket = io.connect('/');
   var viewer = new GameViewer();

   $('#viewer').append(viewer.view);

   socket.on('start', function (data) {
      if (!is_started) {
         viewer.initialize(data);
      }
   });
   
   var brain = new KeyboardBrain();

   socket.on('brain_tick', function (sensors) {
      brain.tick(sensors, function (cmds) {
         socket.emit('brain_tick', cmds);   
      });
   });

   socket.on('tick', function (data) {
      console.log('tick')
      viewer.set_data(data);
   });

   $('#brain-editor .join').click(function () {
      socket.emit('join', 0, function () {
         console.log('joined');
      });
   });   
});
