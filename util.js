module.exports.round = round = function (x, places) {
   var m = (10 * (places || 0) || 1);

   return Math.round(m * x) / m;
};

module.exports.randomAngle = randomAngle = function () {
   return round(random() * Math.PI * 2, 2);
};
