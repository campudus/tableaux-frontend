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
    console.log("--> success if test fails");
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
    }
    catch (e) {
      console.log("--> successfully caught", typeof e);
      return (e instanceof expected);
    }
  }
);

const test = (name) => (tests) => {
  console.log("Running tests:", name);
  const ops = {
    is,
    not,
    throws
  };
  const results = tests.map(
    ([op, expected, fn, args], i) => ops[op](name, i, expected, fn, args)
  );
  console.log(`Tests: ${f.size(results)}, success: ${f.size(f.filter(f.eq(true),
    results))}, failed: ${f.size(f.reject(f.eq(true), results))}`);
};

export default (process.env.NODE_ENV !== "production") ? test : f.noop;
