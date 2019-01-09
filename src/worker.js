const f = require("lodash/fp");
const initLangtags = require("./app/constants/TableauxConstants").initLangtags;
const getDisplayValue = require("./app/helpers/getDisplayValue").default;
const getDisplayValueOld = require("./app/helpers/getDisplayValueOld").default;
const mapWithIndex = f.map.convert({cap: false});
onmessage = function(e) {
  const rows = e.data[0];
  const columns = e.data[1];
  const langtags = e.data[2];
  const tableId = e.data[3];
  initLangtags(langtags);
  const t1 = performance.now();
  const displayValues = f.compose(
    f.map(mapWithIndex((value, id) => getDisplayValue(columns[id])(value))),
    f.map("values")
  )(rows);
  // const t2 = performance.now();
  // console.log(t2 - t1, "generateValues");
  // const t5 = performance.now();
  // const oldDisplayValues = f.compose(
  //   f.map(mapWithIndex((value, id) => getDisplayValueOld(columns[id])(value))),
  //   f.map("values")
  // )(rows);
  // const t6 = performance.now();
  // console.log(t6 - t5, "generateValuesOld");
  // console.log(
  //   "differences",
  //   mapWithIndex((row, id) => {
  //     const zipped = f.zip(row, oldDisplayValues[id]);
  //     const filtered = f.filter(values => !f.isEqual(values[0], values[1]),zipped);
  //     return filtered;
  //   }, displayValues)
  // );
  // console.log("equal? ", f.isEqual(displayValues, oldDisplayValues));
  // const t3 = performance.now();
  const valueString = JSON.stringify(displayValues);
  // const t4 = performance.now();
  // console.log(t4 - t3, "stringify");
  postMessage([valueString,tableId]);
};
