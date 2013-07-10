var util = require('../util');
var assert = require('assert');
var assert = require("assert")

describe('util', function(){
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



