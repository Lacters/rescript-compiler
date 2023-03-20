'use strict';

var Caml = require("../../lib/js/caml.js");
var Curry = require("../../lib/js/curry.js");
var Caml_option = require("../../lib/js/caml_option.js");

function height(param) {
  if (typeof param === "string") {
    return 0;
  } else {
    return param.h;
  }
}

function create(l, x, d, r) {
  var hl = height(l);
  var hr = height(r);
  return /* Node */{
          l: l,
          v: x,
          d: d,
          r: r,
          h: hl >= hr ? hl + 1 | 0 : hr + 1 | 0
        };
}

function singleton(x, d) {
  return /* Node */{
          l: "Empty",
          v: x,
          d: d,
          r: "Empty",
          h: 1
        };
}

function bal(l, x, d, r) {
  var hl;
  hl = typeof l === "string" ? 0 : l.h;
  var hr;
  hr = typeof r === "string" ? 0 : r.h;
  if (hl > (hr + 2 | 0)) {
    if (typeof l === "string") {
      throw {
            RE_EXN_ID: "Invalid_argument",
            _1: "Map.bal",
            Error: new Error()
          };
    }
    var lr = l.r;
    var ld = l.d;
    var lv = l.v;
    var ll = l.l;
    if (height(ll) >= height(lr)) {
      return create(ll, lv, ld, create(lr, x, d, r));
    }
    if (typeof lr !== "string") {
      return create(create(ll, lv, ld, lr.l), lr.v, lr.d, create(lr.r, x, d, r));
    }
    throw {
          RE_EXN_ID: "Invalid_argument",
          _1: "Map.bal",
          Error: new Error()
        };
  }
  if (hr <= (hl + 2 | 0)) {
    return /* Node */{
            l: l,
            v: x,
            d: d,
            r: r,
            h: hl >= hr ? hl + 1 | 0 : hr + 1 | 0
          };
  }
  if (typeof r === "string") {
    throw {
          RE_EXN_ID: "Invalid_argument",
          _1: "Map.bal",
          Error: new Error()
        };
  }
  var rr = r.r;
  var rd = r.d;
  var rv = r.v;
  var rl = r.l;
  if (height(rr) >= height(rl)) {
    return create(create(l, x, d, rl), rv, rd, rr);
  }
  if (typeof rl !== "string") {
    return create(create(l, x, d, rl.l), rl.v, rl.d, create(rl.r, rv, rd, rr));
  }
  throw {
        RE_EXN_ID: "Invalid_argument",
        _1: "Map.bal",
        Error: new Error()
      };
}

function is_empty(param) {
  if (typeof param === "string") {
    return true;
  } else {
    return false;
  }
}

function add(x, data, m) {
  if (typeof m === "string") {
    return /* Node */{
            l: "Empty",
            v: x,
            d: data,
            r: "Empty",
            h: 1
          };
  }
  var r = m.r;
  var d = m.d;
  var v = m.v;
  var l = m.l;
  var c = Caml.int_compare(x, v);
  if (c === 0) {
    if (d === data) {
      return m;
    } else {
      return /* Node */{
              l: l,
              v: x,
              d: data,
              r: r,
              h: m.h
            };
    }
  }
  if (c < 0) {
    var ll = add(x, data, l);
    if (l === ll) {
      return m;
    } else {
      return bal(ll, v, d, r);
    }
  }
  var rr = add(x, data, r);
  if (r === rr) {
    return m;
  } else {
    return bal(l, v, d, rr);
  }
}

function find(x, _param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      throw {
            RE_EXN_ID: "Not_found",
            Error: new Error()
          };
    }
    var c = Caml.int_compare(x, param.v);
    if (c === 0) {
      return param.d;
    }
    _param = c < 0 ? param.l : param.r;
    continue ;
  };
}

function find_first(f, _param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      throw {
            RE_EXN_ID: "Not_found",
            Error: new Error()
          };
    }
    var v = param.v;
    if (Curry._1(f, v)) {
      var _v0 = v;
      var _d0 = param.d;
      var _param$1 = param.l;
      while(true) {
        var param$1 = _param$1;
        var d0 = _d0;
        var v0 = _v0;
        if (typeof param$1 === "string") {
          return [
                  v0,
                  d0
                ];
        }
        var v$1 = param$1.v;
        if (Curry._1(f, v$1)) {
          _param$1 = param$1.l;
          _d0 = param$1.d;
          _v0 = v$1;
          continue ;
        }
        _param$1 = param$1.r;
        continue ;
      };
    }
    _param = param.r;
    continue ;
  };
}

function find_first_opt(f, _param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      return ;
    }
    var v = param.v;
    if (Curry._1(f, v)) {
      var _v0 = v;
      var _d0 = param.d;
      var _param$1 = param.l;
      while(true) {
        var param$1 = _param$1;
        var d0 = _d0;
        var v0 = _v0;
        if (typeof param$1 === "string") {
          return [
                  v0,
                  d0
                ];
        }
        var v$1 = param$1.v;
        if (Curry._1(f, v$1)) {
          _param$1 = param$1.l;
          _d0 = param$1.d;
          _v0 = v$1;
          continue ;
        }
        _param$1 = param$1.r;
        continue ;
      };
    }
    _param = param.r;
    continue ;
  };
}

function find_last(f, _param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      throw {
            RE_EXN_ID: "Not_found",
            Error: new Error()
          };
    }
    var v = param.v;
    if (Curry._1(f, v)) {
      var _v0 = v;
      var _d0 = param.d;
      var _param$1 = param.r;
      while(true) {
        var param$1 = _param$1;
        var d0 = _d0;
        var v0 = _v0;
        if (typeof param$1 === "string") {
          return [
                  v0,
                  d0
                ];
        }
        var v$1 = param$1.v;
        if (Curry._1(f, v$1)) {
          _param$1 = param$1.r;
          _d0 = param$1.d;
          _v0 = v$1;
          continue ;
        }
        _param$1 = param$1.l;
        continue ;
      };
    }
    _param = param.l;
    continue ;
  };
}

function find_last_opt(f, _param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      return ;
    }
    var v = param.v;
    if (Curry._1(f, v)) {
      var _v0 = v;
      var _d0 = param.d;
      var _param$1 = param.r;
      while(true) {
        var param$1 = _param$1;
        var d0 = _d0;
        var v0 = _v0;
        if (typeof param$1 === "string") {
          return [
                  v0,
                  d0
                ];
        }
        var v$1 = param$1.v;
        if (Curry._1(f, v$1)) {
          _param$1 = param$1.r;
          _d0 = param$1.d;
          _v0 = v$1;
          continue ;
        }
        _param$1 = param$1.l;
        continue ;
      };
    }
    _param = param.l;
    continue ;
  };
}

function find_opt(x, _param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      return ;
    }
    var c = Caml.int_compare(x, param.v);
    if (c === 0) {
      return Caml_option.some(param.d);
    }
    _param = c < 0 ? param.l : param.r;
    continue ;
  };
}

function mem(x, _param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      return false;
    }
    var c = Caml.int_compare(x, param.v);
    if (c === 0) {
      return true;
    }
    _param = c < 0 ? param.l : param.r;
    continue ;
  };
}

function min_binding(_param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      throw {
            RE_EXN_ID: "Not_found",
            Error: new Error()
          };
    }
    var l = param.l;
    if (typeof l === "string") {
      return [
              param.v,
              param.d
            ];
    }
    _param = l;
    continue ;
  };
}

function min_binding_opt(_param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      return ;
    }
    var l = param.l;
    if (typeof l === "string") {
      return [
              param.v,
              param.d
            ];
    }
    _param = l;
    continue ;
  };
}

function max_binding(_param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      throw {
            RE_EXN_ID: "Not_found",
            Error: new Error()
          };
    }
    var r = param.r;
    if (typeof r === "string") {
      return [
              param.v,
              param.d
            ];
    }
    _param = r;
    continue ;
  };
}

function max_binding_opt(_param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      return ;
    }
    var r = param.r;
    if (typeof r === "string") {
      return [
              param.v,
              param.d
            ];
    }
    _param = r;
    continue ;
  };
}

function remove_min_binding(param) {
  if (typeof param === "string") {
    throw {
          RE_EXN_ID: "Invalid_argument",
          _1: "Map.remove_min_elt",
          Error: new Error()
        };
  }
  var l = param.l;
  if (typeof l === "string") {
    return param.r;
  } else {
    return bal(remove_min_binding(l), param.v, param.d, param.r);
  }
}

function merge(t1, t2) {
  if (typeof t1 === "string") {
    return t2;
  }
  if (typeof t2 === "string") {
    return t1;
  }
  var match = min_binding(t2);
  return bal(t1, match[0], match[1], remove_min_binding(t2));
}

function remove(x, m) {
  if (typeof m === "string") {
    return "Empty";
  }
  var r = m.r;
  var d = m.d;
  var v = m.v;
  var l = m.l;
  var c = Caml.int_compare(x, v);
  if (c === 0) {
    return merge(l, r);
  }
  if (c < 0) {
    var ll = remove(x, l);
    if (l === ll) {
      return m;
    } else {
      return bal(ll, v, d, r);
    }
  }
  var rr = remove(x, r);
  if (r === rr) {
    return m;
  } else {
    return bal(l, v, d, rr);
  }
}

function update(x, f, m) {
  if (typeof m === "string") {
    var data = Curry._1(f, undefined);
    if (data !== undefined) {
      return /* Node */{
              l: "Empty",
              v: x,
              d: Caml_option.valFromOption(data),
              r: "Empty",
              h: 1
            };
    } else {
      return "Empty";
    }
  }
  var r = m.r;
  var d = m.d;
  var v = m.v;
  var l = m.l;
  var c = Caml.int_compare(x, v);
  if (c === 0) {
    var data$1 = Curry._1(f, Caml_option.some(d));
    if (data$1 === undefined) {
      return merge(l, r);
    }
    var data$2 = Caml_option.valFromOption(data$1);
    if (d === data$2) {
      return m;
    } else {
      return /* Node */{
              l: l,
              v: x,
              d: data$2,
              r: r,
              h: m.h
            };
    }
  }
  if (c < 0) {
    var ll = update(x, f, l);
    if (l === ll) {
      return m;
    } else {
      return bal(ll, v, d, r);
    }
  }
  var rr = update(x, f, r);
  if (r === rr) {
    return m;
  } else {
    return bal(l, v, d, rr);
  }
}

function iter(f, _param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      return ;
    }
    iter(f, param.l);
    Curry._2(f, param.v, param.d);
    _param = param.r;
    continue ;
  };
}

function map(f, param) {
  if (typeof param === "string") {
    return "Empty";
  }
  var l$p = map(f, param.l);
  var d$p = Curry._1(f, param.d);
  var r$p = map(f, param.r);
  return /* Node */{
          l: l$p,
          v: param.v,
          d: d$p,
          r: r$p,
          h: param.h
        };
}

function mapi(f, param) {
  if (typeof param === "string") {
    return "Empty";
  }
  var v = param.v;
  var l$p = mapi(f, param.l);
  var d$p = Curry._2(f, v, param.d);
  var r$p = mapi(f, param.r);
  return /* Node */{
          l: l$p,
          v: v,
          d: d$p,
          r: r$p,
          h: param.h
        };
}

function fold(f, _m, _accu) {
  while(true) {
    var accu = _accu;
    var m = _m;
    if (typeof m === "string") {
      return accu;
    }
    _accu = Curry._3(f, m.v, m.d, fold(f, m.l, accu));
    _m = m.r;
    continue ;
  };
}

function for_all(p, _param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      return true;
    }
    if (!Curry._2(p, param.v, param.d)) {
      return false;
    }
    if (!for_all(p, param.l)) {
      return false;
    }
    _param = param.r;
    continue ;
  };
}

function exists(p, _param) {
  while(true) {
    var param = _param;
    if (typeof param === "string") {
      return false;
    }
    if (Curry._2(p, param.v, param.d)) {
      return true;
    }
    if (exists(p, param.l)) {
      return true;
    }
    _param = param.r;
    continue ;
  };
}

function add_min_binding(k, x, param) {
  if (typeof param === "string") {
    return singleton(k, x);
  } else {
    return bal(add_min_binding(k, x, param.l), param.v, param.d, param.r);
  }
}

function add_max_binding(k, x, param) {
  if (typeof param === "string") {
    return singleton(k, x);
  } else {
    return bal(param.l, param.v, param.d, add_max_binding(k, x, param.r));
  }
}

function join(l, v, d, r) {
  if (typeof l === "string") {
    return add_min_binding(v, d, r);
  }
  var lh = l.h;
  if (typeof r === "string") {
    return add_max_binding(v, d, l);
  }
  var rh = r.h;
  if (lh > (rh + 2 | 0)) {
    return bal(l.l, l.v, l.d, join(l.r, v, d, r));
  } else if (rh > (lh + 2 | 0)) {
    return bal(join(l, v, d, r.l), r.v, r.d, r.r);
  } else {
    return create(l, v, d, r);
  }
}

function concat(t1, t2) {
  if (typeof t1 === "string") {
    return t2;
  }
  if (typeof t2 === "string") {
    return t1;
  }
  var match = min_binding(t2);
  return join(t1, match[0], match[1], remove_min_binding(t2));
}

function concat_or_join(t1, v, d, t2) {
  if (d !== undefined) {
    return join(t1, v, Caml_option.valFromOption(d), t2);
  } else {
    return concat(t1, t2);
  }
}

function split(x, param) {
  if (typeof param === "string") {
    return [
            "Empty",
            undefined,
            "Empty"
          ];
  }
  var r = param.r;
  var d = param.d;
  var v = param.v;
  var l = param.l;
  var c = Caml.int_compare(x, v);
  if (c === 0) {
    return [
            l,
            Caml_option.some(d),
            r
          ];
  }
  if (c < 0) {
    var match = split(x, l);
    return [
            match[0],
            match[1],
            join(match[2], v, d, r)
          ];
  }
  var match$1 = split(x, r);
  return [
          join(l, v, d, match$1[0]),
          match$1[1],
          match$1[2]
        ];
}

function merge$1(f, s1, s2) {
  if (typeof s1 === "string") {
    if (typeof s2 === "string") {
      return "Empty";
    }
    
  } else {
    var v1 = s1.v;
    if (s1.h >= height(s2)) {
      var match = split(v1, s2);
      return concat_or_join(merge$1(f, s1.l, match[0]), v1, Curry._3(f, v1, Caml_option.some(s1.d), match[1]), merge$1(f, s1.r, match[2]));
    }
    
  }
  if (typeof s2 === "string") {
    throw {
          RE_EXN_ID: "Assert_failure",
          _1: [
            "map.ml",
            393,
            10
          ],
          Error: new Error()
        };
  }
  var v2 = s2.v;
  var match$1 = split(v2, s1);
  return concat_or_join(merge$1(f, match$1[0], s2.l), v2, Curry._3(f, v2, match$1[1], Caml_option.some(s2.d)), merge$1(f, match$1[2], s2.r));
}

function union(f, s1, s2) {
  if (typeof s1 === "string") {
    return s2;
  }
  var d1 = s1.d;
  var v1 = s1.v;
  if (typeof s2 === "string") {
    return s1;
  }
  var d2 = s2.d;
  var v2 = s2.v;
  if (s1.h >= s2.h) {
    var match = split(v1, s2);
    var d2$1 = match[1];
    var l = union(f, s1.l, match[0]);
    var r = union(f, s1.r, match[2]);
    if (d2$1 !== undefined) {
      return concat_or_join(l, v1, Curry._3(f, v1, d1, Caml_option.valFromOption(d2$1)), r);
    } else {
      return join(l, v1, d1, r);
    }
  }
  var match$1 = split(v2, s1);
  var d1$1 = match$1[1];
  var l$1 = union(f, match$1[0], s2.l);
  var r$1 = union(f, match$1[2], s2.r);
  if (d1$1 !== undefined) {
    return concat_or_join(l$1, v2, Curry._3(f, v2, Caml_option.valFromOption(d1$1), d2), r$1);
  } else {
    return join(l$1, v2, d2, r$1);
  }
}

function filter(p, m) {
  if (typeof m === "string") {
    return "Empty";
  }
  var r = m.r;
  var d = m.d;
  var v = m.v;
  var l = m.l;
  var l$p = filter(p, l);
  var pvd = Curry._2(p, v, d);
  var r$p = filter(p, r);
  if (pvd) {
    if (l === l$p && r === r$p) {
      return m;
    } else {
      return join(l$p, v, d, r$p);
    }
  } else {
    return concat(l$p, r$p);
  }
}

function partition(p, param) {
  if (typeof param === "string") {
    return [
            "Empty",
            "Empty"
          ];
  }
  var d = param.d;
  var v = param.v;
  var match = partition(p, param.l);
  var lf = match[1];
  var lt = match[0];
  var pvd = Curry._2(p, v, d);
  var match$1 = partition(p, param.r);
  var rf = match$1[1];
  var rt = match$1[0];
  if (pvd) {
    return [
            join(lt, v, d, rt),
            concat(lf, rf)
          ];
  } else {
    return [
            concat(lt, rt),
            join(lf, v, d, rf)
          ];
  }
}

function cons_enum(_m, _e) {
  while(true) {
    var e = _e;
    var m = _m;
    if (typeof m === "string") {
      return e;
    }
    _e = /* More */{
      _0: m.v,
      _1: m.d,
      _2: m.r,
      _3: e
    };
    _m = m.l;
    continue ;
  };
}

function compare(cmp, m1, m2) {
  var _e1 = cons_enum(m1, "End");
  var _e2 = cons_enum(m2, "End");
  while(true) {
    var e2 = _e2;
    var e1 = _e1;
    if (typeof e1 === "string") {
      if (typeof e2 === "string") {
        return 0;
      } else {
        return -1;
      }
    }
    if (typeof e2 === "string") {
      return 1;
    }
    var c = Caml.int_compare(e1._0, e2._0);
    if (c !== 0) {
      return c;
    }
    var c$1 = Curry._2(cmp, e1._1, e2._1);
    if (c$1 !== 0) {
      return c$1;
    }
    _e2 = cons_enum(e2._2, e2._3);
    _e1 = cons_enum(e1._2, e1._3);
    continue ;
  };
}

function equal(cmp, m1, m2) {
  var _e1 = cons_enum(m1, "End");
  var _e2 = cons_enum(m2, "End");
  while(true) {
    var e2 = _e2;
    var e1 = _e1;
    if (typeof e1 === "string") {
      if (typeof e2 === "string") {
        return true;
      } else {
        return false;
      }
    }
    if (typeof e2 === "string") {
      return false;
    }
    if (e1._0 !== e2._0) {
      return false;
    }
    if (!Curry._2(cmp, e1._1, e2._1)) {
      return false;
    }
    _e2 = cons_enum(e2._2, e2._3);
    _e1 = cons_enum(e1._2, e1._3);
    continue ;
  };
}

function cardinal(param) {
  if (typeof param === "string") {
    return 0;
  } else {
    return (cardinal(param.l) + 1 | 0) + cardinal(param.r) | 0;
  }
}

function bindings_aux(_accu, _param) {
  while(true) {
    var param = _param;
    var accu = _accu;
    if (typeof param === "string") {
      return accu;
    }
    _param = param.l;
    _accu = {
      hd: [
        param.v,
        param.d
      ],
      tl: bindings_aux(accu, param.r)
    };
    continue ;
  };
}

function bindings(s) {
  return bindings_aux(/* [] */0, s);
}

var empty = "Empty";

var choose = min_binding;

var choose_opt = min_binding_opt;

exports.empty = empty;
exports.is_empty = is_empty;
exports.mem = mem;
exports.add = add;
exports.update = update;
exports.singleton = singleton;
exports.remove = remove;
exports.merge = merge$1;
exports.union = union;
exports.compare = compare;
exports.equal = equal;
exports.iter = iter;
exports.fold = fold;
exports.for_all = for_all;
exports.exists = exists;
exports.filter = filter;
exports.partition = partition;
exports.cardinal = cardinal;
exports.bindings = bindings;
exports.min_binding = min_binding;
exports.min_binding_opt = min_binding_opt;
exports.max_binding = max_binding;
exports.max_binding_opt = max_binding_opt;
exports.choose = choose;
exports.choose_opt = choose_opt;
exports.split = split;
exports.find = find;
exports.find_opt = find_opt;
exports.find_first = find_first;
exports.find_first_opt = find_first_opt;
exports.find_last = find_last;
exports.find_last_opt = find_last_opt;
exports.map = map;
exports.mapi = mapi;
/* No side effect */
