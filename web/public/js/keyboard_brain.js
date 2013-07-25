var ONE_DEGREE = Math.PI / 180;

var KeyboardBrain = function () {};

KeyboardBrain.prototype.tick = function (sensors, callback) {
   var commands = {};

   commands.radar_heading = sensors.radar_heading + ONE_DEGREE * 30;

   if (Keyboard.is_pressed('left')) {
      commands.turret_heading = sensors.turret_heading - ONE_DEGREE * 10;
   } 
   else if (Keyboard.is_pressed('right')) {
      commands.turret_heading = sensors.turret_heading + ONE_DEGREE * 10;
   }

   if (Keyboard.is_pressed('a')) {
      commands.heading = sensors.heading - ONE_DEGREE * 10;
   } 
   else if (Keyboard.is_pressed('d')) {
      commands.heading = sensors.heading + ONE_DEGREE * 10;
   }
   
   if (Keyboard.is_pressed('w')) {
      commands.speed = 10;
   } 
   else if (Keyboard.is_pressed('s')) {
      commands.speed = -10;
   } 
   else {
      commands.speed = 0;
   }

   if (Keyboard.is_pressed('up')) {
      commands.fire_power = 5;
   }
   else if (Keyboard.is_pressed('down')) {
      commands.fire_power = 1;
   } 
   else {
      commands.fire_power = 0;
   }

   callback(commands);
};