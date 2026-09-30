/* eslint-disable lodash-fp/prefer-constant, lodash-fp/prefer-identity, lodash-fp/consistent-name */

import fp, {
  compact,
  curryN,
  drop,
  first,
  flow,
  identity,
  isEmpty,
  isFunction,
  isNil,
  isInteger,
  map,
  noop,
  prop,
  propOr,
  props,
  range,
  take
} from "lodash/fp";

/* Maybe monad.
 * .of(val) - create from (safe!) value
 * .fromNullable(val) - create
 * .get() get Value, throws if trying to take from None
 * .getOrElse(alternate) - get value, if null return alternate
 * .map(function) - apply 1-aric function or return None
 */
class Maybe {
  static just(a) {
    return new Just(a);
  }

  static none() {
    return new None();
  }

  static fromNullable(a) {
    return a !== null && a !== undefined ? Maybe.just(a) : Maybe.none();
  }

  static of(a) {
    return Maybe.just(a);
  }

  get isNone() {
    return false;
  }

  get isJust() {
    return false;
  }
}

class Just extends Maybe {
  constructor(value) {
    super();
    this._value = value;
  }

  spy(text) {
    console.log(text, this.toString(), this._value);
    return this;
  }

  exec(fname) {
    const fn = prop(fname, this._value);
    if (isFunction(fn)) {
      try {
        const args = map(n => arguments[n], range(1, arguments.length));
        return Maybe.fromNullable(fn.apply(this._value, args));
      } catch (e) {
        return Maybe.none();
      }
    } else {
      return Maybe.none();
    }
  }

  set(field, value) {
    try {
      this._value[field] = value;
      return this;
    } catch (e) {
      return Maybe.none();
    }
  }

  method(fname) {
    const fn = prop(fname, this._value);
    if (isFunction(fn)) {
      try {
        const args = map(n => arguments[n], range(1, arguments.length));
        fn.apply(this._value, args);
        return this;
      } catch (e) {
        return Maybe.none();
      }
    } else {
      return Maybe.none();
    }
  }

  get value() {
    return this._value;
  }

  map(f) {
    return Maybe.fromNullable(f(this.value));
  }

  getOrElse() {
    return this.value;
  }

  filter(f) {
    return Maybe.fromNullable(f(this.value) ? this.value : null);
  }

  get isJust() {
    return true;
  }

  toString() {
    return `Maybe.Just(${typeof this.value}, ${this._value})`;
  }
}

class None extends Maybe {
  map() {
    return this;
  }

  spy() {
    console.log(this.toString());
    return this;
  }

  set() {
    return this;
  }

  exec() {
    return this;
  }

  method() {
    return this;
  }

  get value() {
    throw new TypeError("Can't extract value of Maybe.None");
  }

  getOrElse(other) {
    return other;
  }

  filter() {
    return this.value;
  }

  get isNone() {
    return true;
  }

  toString() {
    return "Maybe.None";
  }
}

/* Either monad.
 * .of(val) - create from (safe!) value
 * .fromNullable(val) - create
 * .get() get Value, throws if trying to take from None
 * .getOrElse(alternate) - get value, if null return alternate
 * .getOrElseThrow(message) - get value, throw custom error if null
 * .orElse(function) - get value, else return another Either from function's result
 * .map(function) - apply 1-aric function or return None
 */
class Either {
  constructor(value) {
    this._value = value;
  }

  get value() {
    return this._value;
  }

  static left(a) {
    return new Left(a);
  }

  static right(a) {
    return new Right(a);
  }

  static fromNullable(val) {
    return val !== null && val !== undefined
      ? Either.right(val)
      : Either.left(val);
  }

  static of(a) {
    return Either.right(a);
  }
}

class Left extends Either {
  map() {
    return this;
  }

  spy(msg = "") {
    console.log(msg, this.toString());
    return this;
  }

  get value() {
    throw new TypeError("Can't extract value of Left.");
  }

  orElse(f) {
    const fOfVal = f(this._value);
    return fOfVal !== null && fOfVal !== undefined
      ? Either.right(fOfVal)
      : this;
  }

  getOrElse(other) {
    return other;
  }

  chain() {
    return this;
  }

  getOrElseThrow(a) {
    throw new Error(a);
  }

  filter() {
    return this;
  }

  exec() {
    return this;
  }

  toString() {
    return "Either.Left()";
  }
}

class Right extends Either {
  map(f) {
    try {
      const result = f(this.value);
      return result ? Either.right(result) : Either.left(this.value);
    } catch (e) {
      return Either.left(e);
    }
  }

  spy(text = "") {
    console.log(text, this.toString());
    return this;
  }

  getOrElse() {
    return this.value;
  }

  orElse() {
    return this;
  }

  chain(f) {
    try {
      return Either.fromNullable(f(this.value));
    } catch (e) {
      return Either.left(e);
    }
  }

  getOrElseThrow() {
    return this.value;
  }

  filter(f) {
    try {
      return Either.fromNullable(f(this.value) ? this.value : null);
    } catch (e) {
      return Either.left(e);
    }
  }

  exec(methodName, ...params) {
    try {
      const result = this.value[methodName].call(this.value, ...params);
      return Either.of(result);
    } catch (err) {
      return Either.Left(err);
    }
  }

  toString() {
    return `Either.Right(${this.value})`;
  }
}

const maybe = x => Maybe.fromNullable(x);
const either = x => Either.fromNullable(x);
const spy = (x, info) => {
  console.log("I spy " + (info || ""), x);
  return x;
};

const fspy = info => x => {
  console.log("I spy " + (info || ""), x);
  return x;
};

const logged = curryN(2)(
  (msg, fn) =>
    function(...args) {
      if (!isFunction(fn)) {
        console.error(fn, "is not a function");
        return undefined;
      }
      const result = fn(...args);
      console.log("Logging:", msg, "=>", result);
      return result;
    }
);

const forkJoin = curryN(4, function(combine, f, g, x) {
  return combine(f(x), g(x));
});

const withTryCatch = curryN(3, (fn, onError = noop, ...args) => {
  try {
    return fn(...args);
  } catch (e) {
    return onError(e);
  }
});

// threading macro to create more readable code
export const doto = (initialValue, ...fns) => {
  const fnArray = isEmpty(fns) ? [identity] : fns;
  return flow(...fnArray)(initialValue);
};

/**
 * (<T1> -> bool) -> (<T1> -> <T2>) -> <T1> -> <T2>
 * If the predicate returns true for the input value, just return the input value
 * else apply the transducer to item
 *
 * unless(nameAlreadySet, setName("default"))(myObject)
 **/
const unless = curryN(3, (predicate, transduce, value) =>
  !predicate(value) ? transduce(value) : value
);

/**
 * (<T1> -> bool) -> (<T1> -> <T2>) -> <T1> -> <T2>
 * If the predicate returns false for the input value, just return the input value
 * else apply the transducer to item
 *
 * when(nameIsEmpty, setName("default")(myObject)
 **/
const when = curryN(3, (predicate, transduce, value) =>
  predicate(value) ? transduce(value) : value
);

const propSuffices = curryN(3, (predicate, propSelector, obj) =>
  predicate(propOr(null, propSelector, obj))
);

// ((a) -> (idx) -> b) -> (a[]) -> b[]
const mapIndexed = curryN(2, (fn, coll) => coll.map(fn));

// ((a) -> (idx) -> bool) -> (a[]) -> a[]
const filterIndexed = curryN(2, (fn, coll) => coll.filter(fn));

const ifElse = curryN(4, (cond, ifFn, elseFn, value) =>
  cond(value) ? ifFn(value) : elseFn(value)
);

const mapPromise = curryN(2, (promiseGenerator, inputs) =>
  Promise.all((inputs || []).map(promiseGenerator))
);

// (T => boolean) -> (path) -> ({ [path] : T }) => boolean
// propMatches(isNumber, "foo", { foo: 42 }) => true
// propMatches(isNumber, "foo.bar", { foo: { bar: "imastring"}}) => false
const propMatches = curryN(3, (pred, path, obj) => pred(prop(path, obj)));

const preventDefault = event => maybe(event).method("preventDefault");
const stopPropagation = event => maybe(event).method("stopPropagation");

const memoizeWith = (keyFn, fn) => {
  const cache = new Map();
  return (...args) => {
    const key = keyFn(...args);
    if (!cache.has(key)) {
      cache.set(key, fn(...args));
    }
    return cache.get(key);
  };
};

const memoizeOne = fn => {
  let key;
  let cache;
  return (...args) => {
    if (key === args[0]) {
      return cache;
    } else {
      key = args[0];
      cache = fn(...args);
      return cache;
    }
  };
};

const firstValidProp = curryN(2, (propsArray, obj) =>
  first(compact(props(propsArray, obj)))
);

const firstValidPropOr = curryN(
  3,
  (elseValue, propsArray, obj) => firstValidProp(propsArray, obj) || elseValue
);

const merge = curryN(2, (first, second) => ({ ...first, ...second }));

// (values: dict<string> -> key: string -> string) -> string
const replaceMoustache = curryN(3, (values, pattern, string) => {
  const value = (values || {})[pattern];
  const re = new RegExp(`{{${pattern || ""}}}`, "g");
  return isNil(value) || isNil(string) ? string : string.replace(re, value);
});

// (size: int) -> (step: int) -> (coll: any[]) -> any[][]
// Recursive implementation. Might cause stack overflow when run against huge arrays
// in browsers without tail end optimisation
const slidingWindow = curryN(3, (size, step, coll, accum = []) => {
  // window or step sizes < 1 will cause infinite loop
  if (
    !(coll instanceof Array) ||
    !isInteger(size) ||
    !isInteger(step) ||
    size < 1 ||
    step < 1
  ) {
    return [];
  }

  return coll.length < size
    ? accum
    : slidingWindow(size, step, drop(step, coll), [...accum, take(size, coll)]);
});

const match = curryN(2, (regex, str) =>
  either(str)
    .exec("match", regex)
    .map(first)
    .getOrElse("")
);

const composeP = (...promises) => value => {
  const initialPromise = fp.last(promises);
  return fp.compose(
    fp.reduce((p, next) => p.then(next), initialPromise(value)),
    fp.tail,
    fp.reverse
  )(promises);
};

const mapP = curryN(2, (promiseGenerator, coll) =>
  Promise.all(coll.map(promiseGenerator))
);

const where = curryN(2, (spec, obj) => {
  const keys = fp.keys(spec);
  return keys.reduce(
    (coll, key) => coll && fp.propEq(key, spec[key])(obj),
    !fp.isNil(spec)
  );
});

/**
 * Replace all values of first array with values of second array.
 * Result will be all values of second array followed by leftover
 * values from right array.
 * mergeArrays([1,2,3], ["a","b"]) -> ["a", "b", 3]
 * mergeArrays(["a","b"], [1,2,3]) -> [1, 2, 3]
 */
const mergeArrays = (oldColl, coll) => {
  const l = coll ? coll.length : 0;
  const result = oldColl ? oldColl.slice(0) : []; // clone
  for (let i = 0; i < l; ++i) {
    result[i] = coll[i];
  }
  return result;
};

const usePropAsKey = propName => coll =>
  propName
    ? (coll || []).reduce((accum, el) => {
        const key = el[propName];
        accum[key] = el;
        return accum;
      }, {})
    : {};

function time(arg1, arg2) {
  const hasTitle = arguments.length === 2;
  const title = hasTitle ? arg1 : "timed function";
  const fn = hasTitle ? arg2 : arg1;

  return (...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(`[${title}] - ${end - start}ms`);
    return result;
  };
}

const intersperse = curryN(2)((delim, coll) =>
  coll.reduce((accum, next, idx) => {
    accum.push(next);
    if (idx < coll.length - 1) accum.push(delim);
    return accum;
  }, [])
);

const scan = (fn, start, coll) => {
  const results = [];
  coll.forEach((value, idx) => {
    const prevValue = idx === 0 ? start : results[idx - 1];
    const result = fn(prevValue, value, idx, results);
    results.push(result);
  });
  return results;
};

export {
  Maybe,
  Just,
  None,
  Either,
  Left,
  Right,
  maybe,
  either,
  spy,
  fspy,
  logged,
  forkJoin,
  withTryCatch,
  when,
  unless,
  propSuffices,
  preventDefault,
  stopPropagation,
  mapIndexed,
  filterIndexed,
  ifElse,
  propMatches,
  mapPromise,
  memoizeWith,
  memoizeOne,
  merge,
  slidingWindow,
  firstValidProp,
  firstValidPropOr,
  match,
  replaceMoustache,
  where,
  composeP,
  mapP,
  mergeArrays,
  usePropAsKey,
  time,
  intersperse,
  scan
};
