import {specAny, specArrayOf, specNotEmpty, specObject, withSpecs} from "./Spec";
import f from "lodash/fp";

// N x STR -> STR: N > 1
const fn1 = withSpecs({
  pre: [[f.isNumber, f.lt(1)], f.isString],
  post: [f.isString]
})(
  function f1 (posNum, str) {
    return str + " " + posNum;
  }
);

// N -> N: N integer
const fn2 = withSpecs(
  {pre: [f.isInteger],
   post: f.isInteger}
)(f.identity);

// Obj -> x: Obj [N1, N2, STR] with N1 number, N2 in ]1, 4[, |STR| > 3; x not falsey
const fn3 = withSpecs({
  pre: [
    specObject({
      num: f.isNumber,
      pnum: [f.isNumber, (n) => 1 < n && n < 4],
      text: [f.isString, (str) => str.length > 3]
    }),
    [f.isNumber, f.lt(0)]
  ],
  post: [f.identity]
})(
  function fn3 ({num, pnum, text}, n2) {
    return !!(num && pnum && text && n2);
  }
);

const fn4 = withSpecs({
  pre: [f.isInteger],
  post: f.isString
})(
  f.identity
);

const fn5 = withSpecs({
  pre: [
    specAny,
    {
      optional: true,
      fn: [f.isInteger, f.gt(10)]
    }
  ]
})(
  function fn5 (a, maybeB) {
    return a + " " + ((f.isNil(maybeB)) ? "no b" : maybeB);
  }
);

const fn6 = withSpecs({
  pre: [[specNotEmpty, specArrayOf([f.isInteger, (n) => n !== 0])]],
  post: specArrayOf(f.isString)
})(
  function arrayOfIntsToStrings (ints) {
    return ints.map(f.toString);
  }
);

const tests = {
  title: "Spec tests",
  tests: [
    ["throws", null, fn1, [0, "five ="]],
    ["throws", null, fn1, [5, 5]],
    ["conformsTo", f.isString, fn1, [5, "five ="]],

    ["is", 1, fn2, [1]],
    ["throws", null, fn2, ["one"]],

    ["is", true, fn3, [{num: -12, pnum: 2.4, text: "foobar"}, 1]],
    ["throws", null, fn3, [{num: -12, pnum: 2.4, text: "foo"}, 1]],

    ["throws", null, fn4, [1]],
    ["throws", null, fn4, ["one"]],
    ["is", "a no b", fn5, ["a"]],
    ["is", "a 1", fn5, ["a", 1]],
    ["throws", null, fn5, ["a", "b"]],
    ["throws", null, fn5, ["a", 11]],

    ["is", ["1", "2", "3"], fn6, [[1, 2, 3]]],
    ["throws", null, fn6, [["1", "2", "3"]]],
    ["throws", null, fn6, [[1, 2, "3", 4, 5]]]
  ]
};

export {tests};
