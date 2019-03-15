/**
 * Provides Clojure-style runtime type class checking (without the power of reader macros, though)
 * To specyfiy type classes, wrap a function with withSpec(specObj)
 *
 * specObj: {
 *   pre: [], // Array of argument predicates; nth entry specifies nth argument. Array entries may be predicates or
 *            // arrays of predicates describing valid input
 *   post: pred | [pred] // Predicate(s) describing valid results
 * }
 *
 * Example: safelyDivideInts = withSpecs({
 *   pre: [f.isInteger,
 *         [f.isInteger, (n) => n != 0]],
 *   post: f.isInteger
 * })((x,y) => (a/b) | 0)     // Int x Int -> Int: f(x,y) = x/0; y != 0
 */

import f from "lodash/fp";
import { doto } from "../helpers/functools";

const isDevel = true;

class ArgumentSpecError extends Error {
  constructor(value, fName = "obj prop", specNum = 0, argNum = 0) {
    super(
      "Argument error: " +
        fName +
        " argument #" +
        argNum +
        " (" +
        value +
        " : " +
        typeof value +
        ") violated spec #" +
        specNum
    );
  }
}

class ResultSpecError extends Error {
  constructor(value, fName, specNum = 0) {
    super(
      "Result error: " +
        fName +
        " result (" +
        value +
        " : " +
        typeof value +
        ") violated spec #" +
        specNum
    );
  }
}

const mkError = (type, value, fName, specNum, argNum) =>
  new (type === "post" ? ResultSpecError : ArgumentSpecError)(
    value,
    fName,
    specNum,
    argNum
  );

const checkSpecs = (type, name) => ([specs, value], pos = 0) => {
  // create array of predicate functions from :
  const specList = f.isArray(specs) // array of predicate functions
    ? specs
    : f.isFunction(specs) // a single predicate functino
    ? [specs]
    : f.isArray(specs.fn) // a spec object containing an "optional" parameter and either an array of predicates
    ? specs.fn
    : [specs.fn]; // ...or a single predicate
  const optional = f.isObject(specs) && specs.optional;

  try {
    return doto(
      specList.map((spec, idx) => {
        //        console.log(name, (type === "post") ? "result" : ("argument #" + pos), "spec", idx, value)
        const matchesSpec = (optional && f.isNil(value)) || spec(value);
        if (!matchesSpec) {
          const err = mkError(type, value, name, idx, pos);
          console.error(err);
          return false;
        } else {
          return true;
        }
      }),
      f.every(f.identity)
    );
  } catch (e) {
    console.error("Exception occured while checking spec:\n", e);
    console.error(mkError(type, value, name, "some"));
    return false;
  }
};

const specObject = specObj => obj => {
  const speccedKeys = f.keys(specObj);
  return (
    f.isObject(obj) &&
    doto(
      speccedKeys,
      f.map(
        f.flow(
          key => [f.get(key, specObj), f.get(key, obj)],
          checkSpecs("obj-spec")
        )
      ),
      f.every(f.identity)
    )
  );
};

const specArrayOf = specs => vals =>
  f.isArray(vals) &&
  doto(
    vals.map((entry, pos) =>
      checkSpecs("array-val", "array-val")([specs, entry], pos)
    ),
    f.every(f.identity)
  );

const specAny = f.complement(f.isNil);
const specNotEmpty = f.complement(f.isEmpty);

const withSpecs = ({ pre, post }) => fn =>
  !isDevel
    ? fn
    : (...args) => {
        const preSpecs = f.isArray(pre) ? pre : [pre];
        const mandatoryArgs = doto(
          preSpecs,
          f.reject(f.get("optional")),
          f.size
        );

        const funcName = doto(fn, f.get("name"), n =>
          f.isEmpty(n) ? "lambda" : n
        );

        if (!f.isNil(pre)) {
          const argSize = f.size(args);
          const specSize = f.size(preSpecs);
          if (argSize < mandatoryArgs) {
            throw new Error("Not enough arguments for function " + funcName);
          } else if (argSize > specSize) {
            console.warn(
              argSize -
                specSize +
                " additional arguments provided to " +
                funcName
            );
          }
        }

        const argsSuccess =
          f.isNil(pre) ||
          (f.size(args) >= mandatoryArgs &&
            doto(
              f.zip(preSpecs, args),
              tuple => tuple.map(checkSpecs("pre", funcName)),
              f.every(f.identity)
            ));

        if (!argsSuccess) {
          throw new Error("Spec error in " + funcName + "(" + args + ")");
        }

        const result = fn(...args);

        if (!f.isNil(post)) {
          if (!checkSpecs("post", funcName)([post, result])) {
            throw new Error("Spec error in " + funcName + "(" + args + ")");
          }
        }

        return result;
      };

export { withSpecs, specObject, specArrayOf, specAny, specNotEmpty };
