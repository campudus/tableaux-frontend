// import * as R from "ramda";
import f from "lodash/fp";

// using named functions will make output more readable

const flattenObject = obj => {
  const go = obj_ =>
    f.chain(([k, v]) => {
      if (f.type(v) === "Object" || f.type(v) === "Array") {
        return f.map(([k_, v_]) => [`${k}.${k_}`, v_], f.go(v));
      } else {
        return [[k, v]];
      }
    }, f.toPairs(obj_));

  return f.fromPairs(go(obj));
};

export const optional = test => f.anyPass([f.isNil, test]);

export const check = spec => (value, previousResults = {}) => {
  let results = previousResults;

  if (f.isFunction(spec)) {
    const specFunction = spec;
    results[specFunction.name] = checkWithFunction(specFunction)(value);
  } else {
    const specObject = spec;
    results = checkWithObject(specObject, results)(value);
  }

  return results;
};

export const isValid = f.compose(
  f.all(f.eq(true)),
  f.values,
  flattenObject
);

export const validate = f.curryN(2, (spec, value) =>
  isValid(check(spec)(value))
);

export const checkOrThrow = f.curryN(2, (spec, value) => {
  const checkResults = check(spec)(value);
  if (isValid(checkResults)) {
    return true;
  } else {
    const specDescription = f.isFunction(spec) ? spec.name : "description";
    throw new Error(
      `Invalid value: ${specDescription} failed for value\n${JSON.stringify(
        value,
        null,
        2
      )}\ncheck results:\n ${JSON.stringify(checkResults, null, 2)}`
    );
  }
});

//
// For lists of possible specifications where any of them must be true
//

export const checkAny = f.curryN(2, (specs, value) =>
  f.map(spec => check(spec)(value), specs)
);

export const isAnyValid = f.compose(
  f.any(x => x),
  f.map(isValid)
);

export const validateAny = f.curryN(2, (specs, value) =>
  f.compose(
    f.any(x => x),
    f.map(spec => validate(spec)(value))
  )(specs)
);

export const checkAnyOrThrow = f.curryN(2, (specs, value) => {
  const checkResults = checkAny(specs)(value);
  if (isAnyValid(checkResults)) {
    return true;
  } else {
    throw new Error(
      `Invalid value: all possible specs failed for value\n${JSON.stringify(
        value,
        null,
        2
      )}\ncheck results:\n ${JSON.stringify(checkResults, null, 2)}`
    );
  }
});

//
// Basic checkers
//

const checkWithFunction = test => value => test(value);

const checkWithObject = (spec, testResult) => value => {
  if (!f.isObject(value) || f.isArray(value) || f.isNil(value)) {
    return { isObject: false };
  }
  f.keys(spec).forEach(key => {
    if (key !== "__self") {
      testResult[key] = check(spec[key])(value[key]);
    }
  });

  const conditions = spec.__self;
  conditions && conditions.forEach(fn => (testResult[fn.name] = fn(value)));
  return testResult;
};
