import unitTests from "./simpleTests";
import f from "lodash/fp";

const modulesWithTests = [
  require("./simpleTests"),
  require("../main/js/helpers/functools"),
  require("../main/js/models/helpers/getDisplayValue"),
  require("../main/js/helpers/multiLanguage"),
  require("../main/js/components/table/GrudGrid")
];

const runTest = testObj => (f.isArray(testObj))
  ? testObj.forEach(runTest)
  : unitTests(testObj.title)(testObj.tests);

const summary = f.reduce(
  (a, b) => ({
    total: a.total + b.total,
    failed: a.failed + b.failed,
    success: a.success + b.success
  }),
  {total: 0, success: 0, failed: 0},

  modulesWithTests
    .map(
      function (mod) {
        return runTest(mod.tests);
      }
    )
);

console.warn(`TEST SUMMARY\n-----------\n${f.size(modulesWithTests)}  modules tested, ${summary.total} tests run, ${summary.failed} tests failed`);
