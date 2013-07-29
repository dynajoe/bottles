$(document).ready(function () {

   var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
      lineNumbers: true,
      matchBrackets: true,
      continueComments: "Enter",
      extraKeys: {"Ctrl-Q": "toggleComment"}
   });
 
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
      viewer.set_data(data);
   });

   var is_joined = false;
   
   $('#brain-editor .join').click(function () {
      var code = editor.getDoc().getValue();
      brain = wrap_brain(code);
      
      if (is_joined) return;

      socket.emit('join', 0, function () {
         is_joined = true;
      });
   });   

   var wrap_brain = function (code) {
      var module = { exports: {} };
      var exports = module.exports;
      
      (function (module, exports) {
         eval(code);
      })(module, exports);

      return module.exports;
   };
});
