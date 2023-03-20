'use strict';


function collect_eq(test_id, suites, loc, x, y) {
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

function collect_neq(test_id, suites, loc, x, y) {
  test_id.contents = test_id.contents + 1 | 0;
  suites.contents = {
    hd: [
      loc + (" id " + String(test_id.contents)),
      (function (param) {
          return {
                  TAG: "Neq",
                  _0: x,
                  _1: y
                };
        })
    ],
    tl: suites.contents
  };
}

function collect_approx(test_id, suites, loc, x, y) {
  test_id.contents = test_id.contents + 1 | 0;
  suites.contents = {
    hd: [
      loc + (" id " + String(test_id.contents)),
      (function (param) {
          return {
                  TAG: "Approx",
                  _0: x,
                  _1: y
                };
        })
    ],
    tl: suites.contents
  };
}

exports.collect_eq = collect_eq;
exports.collect_neq = collect_neq;
exports.collect_approx = collect_approx;
/* No side effect */
