import f from "lodash/fp";

// using named functions in spec objects will make output more
// readable

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

export const isValid = (valueOrObj, prev = true) => {
  return f.isObject(valueOrObj)
    ? prev && f.every(val => isValid(val), f.values(valueOrObj))
    : f.isBoolean(valueOrObj)
    ? prev && valueOrObj
    : false;
};

export const validate = f.curryN(2, (spec, value) =>
  isValid(check(spec)(value))
);

export const checkOrThrow = f.curryN(2, (spec, value) => {
  const checkResults = check(spec)(value);
  if (isValid(checkResults)) {
    return true;
  } else {
    const specDescription = f.isFunction(spec) ? spec.name : "specification";
    throw new Error(
      `Invalid value: ${specDescription} failed with\n${JSON.stringify(
        checkResults,
        null,
        2
      )}\nfor value:\n ${JSON.stringify(value, null, 2)}`
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

const checkWithFunction = testFn => value => testFn(value);

const checkWithObject = (spec, testResult) => value => {
  if (!f.isObject(value) || f.isArray(value) || f.isNil(value)) {
    return { canApplySpecObjectToNonObject: false };
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
