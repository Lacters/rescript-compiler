'use strict';

var List = require("../../lib/js/list.js");
var Path = require("path");
var $$Array = require("../../lib/js/array.js");
var Curry = require("../../lib/js/curry.js");
var Assert = require("assert");
var Process = require("process");

function assert_fail(msg) {
  Assert.fail(undefined, undefined, msg, "");
}

function is_mocha(param) {
  var match = $$Array.to_list(Process.argv);
  if (!match) {
    return false;
  }
  var match$1 = match.tl;
  if (!match$1) {
    return false;
  }
  var exec = Path.basename(match$1.hd);
  if (exec === "mocha") {
    return true;
  } else {
    return exec === "_mocha";
  }
}

function from_suites(name, suite) {
  var match = $$Array.to_list(Process.argv);
  if (match && is_mocha(undefined)) {
    describe(name, (function () {
            return List.iter((function (param) {
                          var partial_arg = param[1];
                          it(param[0], (function () {
                                  return Curry._1(partial_arg, undefined);
                                }));
                        }), suite);
          }));
    return ;
  }
  
}

function close_enough(thresholdOpt, a, b) {
  var threshold = thresholdOpt !== undefined ? thresholdOpt : 0.0000001;
  return Math.abs(a - b) < threshold;
}

function handleCode(spec) {
  switch (spec.TAG) {
    case "Eq" :
        Assert.deepEqual(spec._0, spec._1);
        return ;
    case "Neq" :
        Assert.notDeepEqual(spec._0, spec._1);
        return ;
    case "StrictEq" :
        Assert.strictEqual(spec._0, spec._1);
        return ;
    case "StrictNeq" :
        Assert.notStrictEqual(spec._0, spec._1);
        return ;
    case "Ok" :
        Assert.ok(spec._0);
        return ;
    case "Approx" :
        var b = spec._1;
        var a = spec._0;
        if (!close_enough(undefined, a, b)) {
          Assert.deepEqual(a, b);
          return ;
        } else {
          return ;
        }
    case "ApproxThreshold" :
        var b$1 = spec._2;
        var a$1 = spec._1;
        if (!close_enough(spec._0, a$1, b$1)) {
          Assert.deepEqual(a$1, b$1);
          return ;
        } else {
          return ;
        }
    case "ThrowAny" :
        Assert.throws(spec._0);
        return ;
    case "Fail" :
        return assert_fail("failed");
    case "FailWith" :
        return assert_fail(spec._0);
    
  }
}

function from_pair_suites(name, suites) {
  var match = $$Array.to_list(Process.argv);
  if (match) {
    if (is_mocha(undefined)) {
      describe(name, (function () {
              return List.iter((function (param) {
                            var code = param[1];
                            it(param[0], (function () {
                                    return handleCode(Curry._1(code, undefined));
                                  }));
                          }), suites);
            }));
      return ;
    } else {
      console.log([
            name,
            "testing"
          ]);
      return List.iter((function (param) {
                    var name = param[0];
                    var fn = Curry._1(param[1], undefined);
                    switch (fn.TAG) {
                      case "Eq" :
                          console.log([
                                name,
                                fn._0,
                                "eq?",
                                fn._1
                              ]);
                          return ;
                      case "Neq" :
                          console.log([
                                name,
                                fn._0,
                                "neq?",
                                fn._1
                              ]);
                          return ;
                      case "StrictEq" :
                          console.log([
                                name,
                                fn._0,
                                "strict_eq?",
                                fn._1
                              ]);
                          return ;
                      case "StrictNeq" :
                          console.log([
                                name,
                                fn._0,
                                "strict_neq?",
                                fn._1
                              ]);
                          return ;
                      case "Ok" :
                          console.log([
                                name,
                                fn._0,
                                "ok?"
                              ]);
                          return ;
                      case "Approx" :
                          console.log([
                                name,
                                fn._0,
                                "~",
                                fn._1
                              ]);
                          return ;
                      case "ApproxThreshold" :
                          console.log([
                                name,
                                fn._1,
                                "~",
                                fn._2,
                                " (",
                                fn._0,
                                ")"
                              ]);
                          return ;
                      case "ThrowAny" :
                          return ;
                      case "Fail" :
                          console.log("failed");
                          return ;
                      case "FailWith" :
                          console.log("failed: " + fn._0);
                          return ;
                      
                    }
                  }), suites);
    }
  }
  
}

var val_unit = Promise.resolve(undefined);

function from_promise_suites(name, suites) {
  var match = $$Array.to_list(Process.argv);
  if (match) {
    if (is_mocha(undefined)) {
      describe(name, (function () {
              return List.iter((function (param) {
                            var code = param[1];
                            it(param[0], (function () {
                                    var arg1 = function (x) {
                                      handleCode(x);
                                      return val_unit;
                                    };
                                    return code.then(arg1);
                                  }));
                          }), suites);
            }));
    } else {
      console.log("promise suites");
    }
    return ;
  }
  
}

function eq_suites(test_id, suites, loc, x, y) {
  test_id.contents = test_id.contents + 1 | 0;
  suites.contents = {
    hd: [
      loc + (" id " + String(test_id.contents)),
      (function (param) {
          return {
                  TAG: "Eq",
                  _0: x,
                  _1: y
                };
        })
    ],
    tl: suites.contents
  };
}

function bool_suites(test_id, suites, loc, x) {
  test_id.contents = test_id.contents + 1 | 0;
  suites.contents = {
    hd: [
      loc + (" id " + String(test_id.contents)),
      (function (param) {
          return {
                  TAG: "Ok",
                  _0: x
                };
        })
    ],
    tl: suites.contents
  };
}

function throw_suites(test_id, suites, loc, x) {
  test_id.contents = test_id.contents + 1 | 0;
  suites.contents = {
    hd: [
      loc + (" id " + String(test_id.contents)),
      (function (param) {
          return {
                  TAG: "ThrowAny",
                  _0: x
                };
        })
    ],
    tl: suites.contents
  };
}

exports.from_suites = from_suites;
exports.from_pair_suites = from_pair_suites;
exports.from_promise_suites = from_promise_suites;
exports.eq_suites = eq_suites;
exports.bool_suites = bool_suites;
exports.throw_suites = throw_suites;
/* val_unit Not a pure module */
