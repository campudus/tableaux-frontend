import * as f from "lodash/fp";

const is = f.curryN(5)(
  (testname, i, expected, fn, args) => {
    const result = fn.apply(null, args);
    console.log(`${testname} test #${i + 1}: calling ${fn.name} with args`, args, "=>", result);
    if (f.equals(result, expected)) {
      console.log("--> success");
      return true;
    } else {
      console.log("--> failure: expected", expected, "got", result);
      return false;
    }
  }
);

const not = f.curryN(5)(
  (testname, i, expected, fn, args) => {
    const test = !is(testname, i, expected, fn, args);
    console.log("--> expected to fail");
    return test;
  }
);

const throws = f.curryN(5)(
  (testname, i, expected, fn, args) => {
    try {
      console.log(`${testname} test #${i + 1} calling ${fn.name} with args`, args);
      const result = fn.apply(null, args);
      console.log("--> failure: expected to throw, but returned", result);
      return false;
    } catch (e) {
      console.log("--> successfully caught", e.name);
      return true;
    }
  }
);

const conformsTo = f.curryN(5)(
  (testname, i, testFn, fn, args) => {
    if (!f.isFunction(testFn)) {
      throw new TypeError("simpleTests.coformsTo was called with testFunction", testFn, "of type", f.get("type", testFn), "expected a callable object");
    }
    const result = fn.apply(null, args);
    const testResult = testFn(result);
    console.log(`${testname} test #${i + 1}: calling ${fn.name} with args`, args, "=>", result);
    if (testResult) {
      console.log("--> success");
      return true;
    } else {
      console.log(`--> failure: expected validator ${testFn.name}(${result}) to be truthy, got`, testResult);
      return false;
    }
  }
);

// expects an array of tests, each consisting of:
// [
//  op from ["conformsTo", "is", "not", "throws"],
//  (un-)expected result | error object class | validator function,
//  function to evaluate,
//  array of arguments
// ]
const unitTests = (name) => (tests) => {
  console.log("Running tests:", name);
  const ops = {
    conformsTo,
    is,
    not,
    throws
  };
  try {
    const results = tests.map(
      ([op, expected, fn, args], i) => {
        try {
          return ops[op](name, i, expected, fn, args);
        } catch (err) {
          console.error(err);
          console.log("--> failure: trying to execute test #" + i + " threw unexpected exception");
          return false;
        }
      }
    );

    const summary = {
      total: f.size(results),
      success: f.size(f.filter(f.eq(true), results)),
      failed: f.size(f.reject(f.eq(true), results))
    };

    const message = `${summary.total} tests run, ${summary.success} succeeded, ${summary.failed} failed`;
    ((summary.failed > 0) ? console.error : console.warn)(message);
    return summary;
  } catch (IEWithClosedConsole) {
    // For some reason, IE will fail when trying to run the functions picked from the ops map while the
    // developer console is not open.
    return {};
  }
};

const unitTestFunction = (process.env.NODE_ENV !== "production")
  ? (() => { console.warn("process.env.NODE_ENV !== production; testing enabled"); return unitTests; })()
  : f.noop;

const tests = {
  title: "Tests functions self-test",
  tests: [
    ["throws", null, conformsTo, ["generated throwing test", -1, null, f.noop, []]],
    ["is", true, conformsTo, ["generated true test", -1, f.isEmpty, f.identity, []]],
    ["not", true, conformsTo, ["generated false test", -1, f.isEmpty, f.identity, ["no-number"]]],
    ["not", true, f.equals, [1, 2]],
    ["conformsTo", f.isString, f.always("string"), [1, 2, 3]]
  ]
};

export {tests};
export default unitTestFunction;
