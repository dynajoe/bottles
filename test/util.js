var util = require('../lib/util');
var assert = require('assert');

describe('util', function () {
   describe('#distance()', function () {
      it('should be able to calculate the distance between two points', function () {
         assert.equal(util.distance({x: 0, y: 0}, {x: 100, y: 0}), 100);
      });
      it('should be able to calculate the distance between two points at an angle', function () {
         assert.equal(util.distance({x: 0, y: 0}, {x: 1, y: 1}), Math.sqrt(2));
      });
   });

   describe('#round()', function () {
      it('should round correctly', function () {
         assert.equal(util.round(10.1234, 3), 10.123);
      });
      it('should round correctly up', function () {
         assert.equal(util.round(10.12345, 4), 10.1235);
      });
   });

   describe('#bound()', function () {
      it('should bound a point to an area', function () {
         var newPos = util.bound({ x: 10, y: 15 }, { width: 5, height: 4 });
         assert.equal(newPos.x, 5);
         assert.equal(newPos.y, 4);
      });
   });

   describe('#bound_heading()', function () {
      it('should bound a heading to a specific delta', function () {
         util.bound_heading(0, 1, 0.001).should.equal(0.001);
      });
   });

   describe('#normalize_radians()', function () {
      it('should normalize values greater than 2 PI', function () {
         assert.equal(util.normalize_radians(util.FULL_ANGLE + Math.PI / 4), Math.PI / 4);
      });
   });

   describe('#move()', function () {
      it('should move a point upward', function () {
         var newPos = util.move({ x: 0, y: 0 }, 0, 1);
         assert.equal(newPos.x, 0);
         assert.equal(newPos.y, 1);
      });
      it('should move a point to the right', function () {
         var newPos = util.move({ x: 0, y: 0 }, Math.PI / 2, 1);
         assert.equal(newPos.x, 1);
         assert.equal(newPos.y, 0);
      });
      it('should move a point down', function () {
         var newPos = util.move({ x: 0, y: 0 }, Math.PI, 1);
         assert.equal(newPos.x, 0);
         assert.equal(newPos.y, -1);
      });
      it('should move a point to the left', function () {
         var newPos = util.move({ x: 0, y: 0 }, -Math.PI / 2, 1);
         assert.equal(newPos.x, -1);
         assert.equal(newPos.y, 0);
      });
      it('should move a point and bound to area if bounds specified', function () {
         var newPos = util.move({ x: 0, y: 0 }, 0, 1, { width: .5, height: .5 });
         assert.equal(newPos.x, 0);
         assert.equal(newPos.y, .5);
      });
   });

   describe('#heading_between_points()', function () {
      it('should return 0 when the value is above', function () {
         util.heading_between_points({ x: 0, y: 0 }, { x: 0, y: 1}).should.equal(0);
      });
      it('should return pi when the value is below', function () {
         util.heading_between_points({ x: 0, y: 0 }, { x: 0, y: -1}).should.equal(Math.PI);
      });
      it('should return pi/2 when the value is to the right', function () {
         util.heading_between_points({ x: 0, y: 0 }, { x: 1, y: 0}).should.equal(Math.PI / 2);
      });
      it('should return 3pi/2 when the value is to the left', function () {
         util.heading_between_points({ x: 0, y: 0 }, { x: -1, y: 0}).should.equal(-Math.PI / 2);
      });
      it('should return pi/4 when the value is to the right and above', function () {
         util.heading_between_points({ x: 0, y: 0 }, { x: 1, y: 1}).should.equal(Math.PI / 4);
      });
      it('should return 5pi/4 when the value is to the left and below', function () {
         util.heading_between_points({ x: 0, y: 0 }, { x: -1, y: -1}).should.equal(-(3 * Math.PI) / 4);
      });
      it('should return 7pi/4 when the value is to the left and above', function () {
         util.heading_between_points({ x: 0, y: 0 }, { x: -1, y: 1}).should.equal(-Math.PI / 4);
      });
      it('should return 3pi/4 when the value is to the right and below', function () {
         util.heading_between_points({ x: 0, y: 0 }, { x: 1, y: -1}).should.equal((3 * Math.PI) / 4);
      });
   });
});



