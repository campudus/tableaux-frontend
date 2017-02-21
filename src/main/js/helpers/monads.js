import {prop, isFunction} from "lodash/fp";

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
    return (a !== null && a !== undefined) ? Maybe.just(a) : Maybe.none();
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

  exec(fname, args) {
    if (isFunction(prop(fname, this._value))) {
      prop(fname, this._value).apply(this._value, args);
      return this;
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
    return `Maybe.Just(${this.value})`;
  }
}

class None extends Maybe {
  map(f) {
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
    return (val !== null && val !== undefined)
      ? Either.right(val)
      : Either.left(val);
  }

  static of(a) {
    return Either.right(a);
  }
}

class Left extends Either {
  map(_) {
    return this;
  }

  get value() {
    throw new TypeError("Can't extract value of Left.");
  }

  orElse(f) {
    const fOfVal = f(this._value);
    return (fOfVal !== null && fOfVal !== undefined)
      ? Either.right(fOfVal)
      : this;
  }

  getOrElse(other) {
    return other;
  }

  chain(f) {
    return this;
  }

  getOrElseThrow(a) {
    throw new Error(a);
  }

  filter(f) {
    return this;
  }

  toString() {
    return `Either.Left(${this.value})`;
  }
}

class Right extends Either {
  map(f) {
    try {
      const result = f(this.value);
      return (result)
        ? Either.right(result)
        : Either.left(this.value);
    } catch (e) {
      return Either.left(e);
    }
  }

  getOrElse(other) {
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

  getOrElseThrow(_) {
    return this.value;
  }

  filter(f) {
    try {
      return Either.fromNullable(f(this.value) ? this.value : null);
    } catch (e) {
      return Either.left(e);
    }
  }

  toString() {
    return `Either.Right(${this.value})`;
  }
}

const maybe = x => Maybe.fromNullable(x);
const either = x => Either.fromNullable(x);
const spy = (x, info) => {
  console.log("I spy " + ((info) || ""), x);
  return x;
};

export {Maybe, Just, None, Either, Left, Right, maybe, either, spy};
