var Keyboard = Keyboard || {};

(function () {
   map = {
      37: 'left',
      39: 'right',
      38: 'up',
      40: 'down',
      13: 'enter',
      32: 'space'
   }

   Keyboard = {};
   pressed = {};

   var onKeyChanged = function (e, down) {
      if (map[e.which]) {
         pressed[map[e.which]] = down;
      } else {
         pressed[e.which] = down;         
      }

      pressed['shift'] = e.shiftKey;
      pressed['ctrl'] = e.ctrlKey;
      pressed['alt'] = e.altKey;

   }

   document.addEventListener("keydown", function (e) {
      onKeyChanged(e, true);
   }, false);


   document.addEventListener("keyup", function (e) {
      onKeyChanged(e, false);
   }, false);

   Keyboard.is_pressed = function (key) {
      if (key.length === 1) {
         return pressed[key.toUpperCase().charCodeAt(0)];
      }

      return pressed[key.toLowerCase()];
   }
})();
