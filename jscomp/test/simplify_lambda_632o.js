'use strict';


function f(x) {
  switch (x) {
    case "X1" :
        return "X1";
    case "X2" :
        return "X2";
    case "X3" :
        return "X3";
    case "X4" :
        return "X4";
    
  }
}

function f2(x) {
  switch (x) {
    case "X1" :
        return "X1";
    case "X2" :
        return "X2";
    case "X3" :
        return "X3";
    case "X4" :
        return "X4";
    
  }
}

exports.f = f;
exports.f2 = f2;
/* No side effect */
