$(document).ready(function () {
   var code = localStorage.getItem('code');

   if (code) $('#code').val(code);

   var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
      lineNumbers: true,
      value: code,
      matchBrackets: true,
      continueComments: "Enter",
      theme: 'ambiance',
      extraKeys: {"Ctrl-Q": "toggleComment"}, 
      tabSize: 3,
      lineWrapping: true
   });

   var socket = io.connect('/');
   var viewer = new GameViewer();

   $('#viewer').append(viewer.view);

   var is_started = false;
   var brain = new KeyboardBrain();

   socket.on('start', function (data) {
      if (!is_started) {
         brain.config = data.config;
         viewer.set_data(data);
         $('#viewer-overlay').addClass('hide');
      }
   });

   socket.on('end', function (data) {
      console.log(data)
   });

   socket.on('brain_tick', function (sensors) {
      brain.tick(sensors, function (cmds) {
         socket.emit('brain_tick', cmds);
      });
   });

   socket.on('tick', function (data) {
      viewer.set_data(data);
   });

   var is_joined = false;

   var update_brain = function () {
      var code = editor.getDoc().getValue();
      brain = wrap_brain(code);

   };

   $('#brain-editor .save').click(function () {
      var code = editor.getDoc().getValue();
      localStorage.setItem('code', code);
   });

   $('#brain-editor .restart').click(function () {
      socket.emit('restart');
   });

   $('#brain-editor .update').click(function () {
     update_brain();
   });

   $('#waiting a.add-comp-type').click(function () {
      var type = $('input', $(this)).val();
      socket.emit('add_comp', type);
   });

   $('#waiting a.add-comp').click(function () {
      var type = $('#comp').val();
      socket.emit('add_comp', type);
   });

   $('#waiting a.start').click(function () {
      socket.emit('start');
   });

   $('#join-game form').submit(function () {
      var $this = $(this);

      update_brain();

      $('#join-game').addClass('hide');

      socket.emit('join', $('input', $this).val(), brain.name);

      return false;
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
