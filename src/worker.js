const f = require("lodash/fp");
const initLangtags = require("./app/constants/TableauxConstants").initLangtags;
const getDisplayValue = require("./app/helpers/getDisplayValue").default;
const getDisplayValueOld = require("./app/helpers/getDisplayValueOld").default;
const identifyUniqueLinkedRows = require("./app/helpers/linkHelper").default;
const mapWithIndex = f.map.convert({ cap: false });
onmessage = function(e) {
  const rows = e.data[0];
  const columns = e.data[1];
  const langtags = e.data[2];
  const tableId = e.data[3];
  initLangtags(langtags);
  const t1 = performance.now();
  const uniqueLinks = identifyUniqueLinkedRows(rows, columns);
  const linkDisplayValues = f.map(outer => {
    return {
      tableId: outer.tableId,
      values: f.map(value => {
        return { id: value.id, values: getDisplayValue(outer.column)([value]) };
      }, outer.values)
    };
  }, uniqueLinks);
  const displayValues = {
    tableId,
    values: f.compose(
      f.map(row => {
        return {
          ...row,
          values: mapWithIndex((value, id) => {
            const column = columns[id];
            if (column.kind == "link") {
              return { tableId: column.toTable, rowIds: f.map("id", value) };
            }
            return getDisplayValue(column)(value);
          }, row.values)
        };
      })
    )(rows)
  };
  const combined = ((displayValues, linkDisplayValues) => {
    const alreadyExistsAt = f.findIndex(
      element => element.tableId == displayValues.tableId,
      linkDisplayValues
    );
    if (alreadyExistsAt == -1) {
      return f.concat(linkDisplayValues, displayValues);
    }
    return f.set([alreadyExistsAt], displayValues, linkDisplayValues);
  })(displayValues, linkDisplayValues);
  const t2 = performance.now();
  console.log(t2 - t1);
  postMessage([combined, tableId]);
};
