var getConfig = function getConfig(){
  return module.exports.config
}

var sign = function (number, d) {
  return !nearZero(number, d) ? number < 0 ? -1 : 1 : 0
}

var nearZero = function (number, d) {
  d = d ? d : .0001;
  return Math.abs(number) <= d
}

var normalizeHeading = function normalizeHeading (h){
   var max = Math.PI * 2
   for(;h < 0; h += max);
   for(;h >= max; h -= max);
   return h
}

var toDegrees = function (h){
  return h * 180 / Math.PI
}

var isOnWall = function isOnWall(pt){
    return false
      || isOnNorthWall(pt)
      || isOnEastWall(pt)
      || isOnWestWall(pt)
      || isOnSouthWall(pt)
}

var isOnHorizontalWall = function isOnHorizontalWall(pt){
    return false
      || isOnNorthWall(pt)
      || isOnSouthWall(pt)
}

var isOnVerticalWall = function isOnVerticalWall(pt){
    return false
      || isOnEastWall(pt)
      || isOnWestWall(pt)
}

var isOnNorthWall = function isOnNorthWall(pt){
  return pt.y <= getConfig().bot_radius
}
var isOnSouthWall = function isOnSouthWall(pt){
  return pt.y >= module.exports.config.arena.height - getConfig().bot_radius
}
var isOnWestWall = function isOnEastWall(pt){
  return pt.x <= getConfig().bot_radius
}
var isOnEastWall = function isOnWestWall(pt){
  return pt.x >= module.exports.config.arena.width - getConfig().bot_radius
}

var headingToAngle = function (h){
  return Math.PI / 2 - h
};
var angleToHeading = function (angle){
  return Math.PI / 2 - angle
};
var heading = null;
var calculateHeading = function (sensors){
  var position = sensors.position;
  if(!heading) heading = sensors.heading;
  if(!nearZero(sensors.heading - heading))
    return heading;
  if(!isOnWall(position))
    return heading;
  heading = normalizeHeading(isOnHorizontalWall(position)
    ? horizontalReflection(heading)
    : verticalReflection(heading));
  return heading;
};

var verticalReflection = function verticalReflection(i){
  var r = 0.5*Math.PI - (i + Math.PI - 0.5*Math.PI)
  r = 2*Math.PI - i 
  r = -i //subtract 2*Math.PI
  return r;
};

var horizontalReflection = function horizontalReflection(i){
  var r = 0 - (i + Math.PI - 0)
  r = -Math.PI - i
  return r;
};

module.exports.name = 'ricochet';

module.exports.tick = function (sensors, cb) {
  
  var speed = sensors.radar.length ? Math.PI / 1800 : 1;
  heading = heading == null ? sensors.heading : heading;
  heading = calculateHeading(sensors)
  var command = {
    speed: nearZero(sensors.heading - heading, Math.PI / 10)
      ? getConfig().max_bot_speed / 2
      : .2,
    heading: heading,
    radar_heading: sensors.turret_heading,
    turret_heading: sensors.turret_heading +
      ((sensors.ticks > 360) ? speed : 0),
    fire_power: Math.min(1, sensors.radar.length),
  };

  cb(command);
}