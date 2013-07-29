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
   return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)); 
};

Vector.prototype.distance = function (other) {
   return Math.sqrt(Math.pow((this.x - other.x) , 2) + Math.pow((this.y - other.y), 2));
};

Vector.prototype.normalize = function () {
   var mag = this.magnitude();
   return { x: this.x / mag, y: this.y / mag }; 
};

module.exports = Vector;