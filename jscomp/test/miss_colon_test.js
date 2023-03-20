'use strict';


function $plus$colon(_f, _g) {
  while(true) {
    var g = _g;
    var f = _f;
    if (f.TAG === "Int") {
      var n = f._0;
      if (g.TAG === "Int") {
        return {
                TAG: "Int",
                _0: n + g._0 | 0
              };
      }
      if (n === 0) {
        return g;
      }
      
    }
    switch (g.TAG) {
      case "Int" :
          if (g._0 !== 0) {
            return {
                    TAG: "Add",
                    _0: f,
                    _1: g
                  };
          } else {
            return f;
          }
      case "Add" :
          _g = g._1;
          _f = $plus$colon(f, g._0);
          continue ;
      case "Var" :
      case "Mul" :
          return {
                  TAG: "Add",
                  _0: f,
                  _1: g
                };
      
    }
  };
}

function $star$colon(_f, _g) {
  while(true) {
    var g = _g;
    var f = _f;
    var exit = 0;
    var exit$1 = 0;
    if (f.TAG === "Int") {
      var n = f._0;
      if (g.TAG === "Int") {
        return {
                TAG: "Int",
                _0: Math.imul(n, g._0)
              };
      }
      if (n === 0) {
        return {
                TAG: "Int",
                _0: 0
              };
      }
      exit$1 = 3;
    } else {
      exit$1 = 3;
    }
    if (exit$1 === 3) {
      if (g.TAG === "Int") {
        if (g._0 === 0) {
          return {
                  TAG: "Int",
                  _0: 0
                };
        }
        exit = 2;
      } else {
        exit = 2;
      }
    }
    if (exit === 2 && f.TAG === "Int" && f._0 === 1) {
      return g;
    }
    switch (g.TAG) {
      case "Int" :
          if (g._0 !== 1) {
            return {
                    TAG: "Mul",
                    _0: f,
                    _1: g
                  };
          } else {
            return f;
          }
      case "Var" :
      case "Add" :
          return {
                  TAG: "Mul",
                  _0: f,
                  _1: g
                };
      case "Mul" :
          _g = g._1;
          _f = $star$colon(f, g._0);
          continue ;
      
    }
  };
}

function simplify(f) {
  switch (f.TAG) {
    case "Int" :
    case "Var" :
        return f;
    case "Add" :
        return $plus$colon(simplify(f._0), simplify(f._1));
    case "Mul" :
        return $star$colon(simplify(f._0), simplify(f._1));
    
  }
}

exports.$plus$colon = $plus$colon;
exports.$star$colon = $star$colon;
exports.simplify = simplify;
/* No side effect */
