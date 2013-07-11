var util = require('../lib/util');
var assert = require('assert');

describe('util', function(){
   describe('#distance()', function () {
      it('should be able to calculate the distance between two points', function () {
         assert.equal(util.distance({x: 0, y: 0}, {x: 100, y: 0}), 100);
      });
      it('should be able to calculate the distance between two points at an angle', function () {
         assert.equal(util.distance({x: 0, y: 0}, {x: 1, y: 1}), Math.sqrt(2));
      });
   });

   describe('#is_within_radians()', function () {
      it('should be able to determine if a radar can detect a bot within its vision', function () {
         assert.equal(util.is_within_radians(0, Math.PI / 8, Math.PI / 4), true);
      });
      it('should not detect a bot outside its vision', function () {
         assert.equal(util.is_within_radians(0, (Math.PI / 8) + util.ONE_DEGREE, Math.PI / 4), false);
      });
   });

   describe('#bound()', function () {
      it('should bound a point to an area', function () {
         var newPos = util.bound({ x: 10, y: 15 }, { width: 5, height: 4 });
         assert.equal(newPos.x, 5);
         assert.equal(newPos.y, 4);
      });
   });

   describe('#normalize_radians()', function () {
      it('should normalize values greater than 2 PI', function () {
         assert.equal(util.normalize_radians(FULL_ANGLE + Math.PI / 4), Math.PI / 4);
      });
   });

   describe('#move()', function () {
      it('should move a point upward', function () {
         var newPos = util.move({ x: 0, y: 0 }, 0, 1);
         assert.equal(newPos.x, 0, 'wrong x');
         assert.equal(newPos.y, 1, 'wrong y');
      });
      it('should move a point and bound to area if bounds specified', function () {
         var newPos = util.move({ x: 0, y: 0 }, 0, 1, { width: .5, height: .5 });
         assert.equal(newPos.x, 0, 'wrong x');
         assert.equal(newPos.y, .5, 'wrong y');
      });

   });

   describe('#heading()', function(){
      it('should return 0 when the value is above', function(){
         assert.equal(util.heading({ x: 0, y: 0 }, { x: 0, y: 1}), 0);
      });
      it('should return pi when the value is below', function(){
         assert.equal(util.heading({ x: 0, y: 0 }, { x: 0, y: -1}), Math.PI);
      });
      it('should return pi/2 when the value is to the right', function(){
         assert.equal(util.heading({ x: 0, y: 0 }, { x: 1, y: 0}), Math.PI / 2);
      });
      it('should return 3pi/2 when the value is to the left', function(){
         assert.equal(util.heading({ x: 0, y: 0 }, { x: -1, y: 0}), (3 * Math.PI) / 2);
      });
      it('should return pi/4 when the value is to the right and above', function(){
         assert.equal(util.heading({ x: 0, y: 0 }, { x: 1, y: 1}), Math.PI / 4);
      });
      it('should return 5pi/4 when the value is to the left and below', function(){
         assert.equal(util.heading({ x: 0, y: 0 }, { x: -1, y: -1}), (5 * Math.PI) / 4);
      });
      it('should return 7pi/4 when the value is to the left and above', function(){
         assert.equal(util.heading({ x: 0, y: 0 }, { x: -1, y: 1}), (7 * Math.PI) / 4);
      });
      it('should return 3pi/4 when the value is to the right and below', function(){
         assert.equal(util.heading({ x: 0, y: 0 }, { x: 1, y: -1}), (3 * Math.PI) / 4);
      });
   });
});



