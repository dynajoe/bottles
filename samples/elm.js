module.exports.name = "Elm";

const elm_ports = window.Elm.App.worker().ports;
var current_callback;

elm_ports.brainTick.subscribe(function (update) {
   if (current_callback) {
      setTimeout(current_callback.bind(null, {
         fire_power: update.fire_power,
         speed: update.speed,
         turret_heading: update.turret_heading,
         radar_heading: update.radar_heading,
         heading: update.heading,
      }), 10);
   }
});

module.exports.tick = function (sensors, cb) {
   elm_ports.brainUpdate.send({
      heading: sensors.heading,
      turretHeading: sensors.turret_heading,
      radarHeading:sensors.radar_heading,
      position: sensors.position,
      speed: sensors.speed,
      firePower: sensors.fire_power,
      radar: sensors.radar,
      ticks: sensors.ticks
   });

   current_callback = cb;
}