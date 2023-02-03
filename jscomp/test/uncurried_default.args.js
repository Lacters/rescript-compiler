'use strict';

var Curry = require("../../lib/js/curry.js");

function withOpt(xOpt, y) {
  var x = xOpt !== undefined ? xOpt : 1;
  return function (zOpt, w) {
    var z = zOpt !== undefined ? zOpt : 1;
    return ((x + y | 0) + z | 0) + w | 0;
  };
}

var testWithOpt = withOpt(undefined, 3)(undefined, 4);

var partial_arg = 10;

var partial = Curry._1((function (param) {
            return withOpt(partial_arg, param);
          })(3), 4)(11);

var total = withOpt(10, 3)(4, 11);

function foo1(xOpt, y) {
  var x = xOpt !== undefined ? xOpt : 3;
  return x + y | 0;
}

var x = 3;

var r1 = x + 11 | 0;

function foo2(y, xOpt, zOpt) {
  var x = xOpt !== undefined ? xOpt : 3;
  var z = zOpt !== undefined ? zOpt : 4;
  return (x + y | 0) + z | 0;
}

var r2 = foo2(11, undefined, undefined);

function foo3(xOpt, yOpt) {
  var x = xOpt !== undefined ? xOpt : 3;
  var y = yOpt !== undefined ? yOpt : 4;
  return x + y | 0;
}

var r3 = foo3(undefined, undefined);

var StandardNotation = {
  withOpt: withOpt,
  testWithOpt: testWithOpt,
  partial: partial,
  total: total,
  foo1: foo1,
  r1: r1,
  foo2: foo2,
  r2: r2,
  foo3: foo3,
  r3: r3
};

function withOpt$1(xOpt, y) {
  var x = xOpt !== undefined ? xOpt : 1;
  return function (zOpt, w) {
    var z = zOpt !== undefined ? zOpt : 1;
    return ((x + y | 0) + z | 0) + w | 0;
  };
}

var testWithOpt$1 = withOpt$1(undefined, 3)(undefined, 4);

var partial_arg$1 = 10;

var partial$1 = Curry._1((function (param) {
            return withOpt$1(partial_arg$1, param);
          })(3), 4)(11);

var total$1 = withOpt$1(10, 3)(4, 11);

function foo1$1(xOpt, y) {
  var x = xOpt !== undefined ? xOpt : 3;
  return x + y | 0;
}

var x$1 = 3;

var r1$1 = x$1 + 11 | 0;

function foo2$1(y, xOpt, zOpt) {
  var x = xOpt !== undefined ? xOpt : 3;
  var z = zOpt !== undefined ? zOpt : 4;
  return (x + y | 0) + z | 0;
}

var r2$1 = foo2$1(11, undefined, undefined);

function foo3$1(xOpt, yOpt) {
  var x = xOpt !== undefined ? xOpt : 3;
  var y = yOpt !== undefined ? yOpt : 4;
  return x + y | 0;
}

var r3$1 = foo3$1(undefined, undefined);

function foo(func) {
  return func(undefined) + 1 | 0;
}

var M = {
  foo: foo
};

exports.StandardNotation = StandardNotation;
exports.withOpt = withOpt$1;
exports.testWithOpt = testWithOpt$1;
exports.partial = partial$1;
exports.total = total$1;
exports.foo1 = foo1$1;
exports.r1 = r1$1;
exports.foo2 = foo2$1;
exports.r2 = r2$1;
exports.foo3 = foo3$1;
exports.r3 = r3$1;
exports.M = M;
/* testWithOpt Not a pure module */
