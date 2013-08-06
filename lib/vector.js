'use strict';
var Vector = function (vector) {
   this.x = vector.x;
   this.y = vector.y;
};

Vector.prototype.add = function (other) {
   return new Vector({ x: this.x + other.x, y: this.y + other.y });
};

Vector.prototype.subtract = function (other) {
   return new Vector({ x: this.x - other.x, y: this.y - other.y });
};

Vector.prototype.multiply = function (value) {
   return new Vector({ x: this.x * value, y: this.y * value });
};

Vector.prototype.divide = function (value) {
   return new Vector({ x: this.x / value, y: this.y / value });
};

Vector.prototype.dot = function (other) {
   return this.x * other.x + this.y * other.y; 
};

Vector.prototype.magnitude = function () {
   return Math.sqrt(this.magnitude_squared());
};

Vector.prototype.distance = function (other) {
   return Math.sqrt(this.distance_squared(other));
};

Vector.prototype.magnitude_squared = function () {
   return Math.pow(this.x, 2) + Math.pow(this.y, 2);
};

Vector.prototype.distance_squared = function (other) {
   return Math.pow((this.x - other.x) , 2) + Math.pow((this.y - other.y), 2);
};

Vector.prototype.normalize = function () {
   var mag = this.magnitude();
   return new Vector({ x: this.x / mag, y: this.y / mag }); 
};

Vector.prototype.equals = function (other) {
   return other && this.x === other.x && this.y === other.y;
};

Vector.prototype.project = function (other) {
   var dp = this.dot(other);
   var mag = other.magnitude();
   var normal = other.normalize();
   var proj = normal.multiply(dp).divide(mag);   
   return proj;
};

module.exports = Vector;