import f from "lodash/fp";
import { initLangtags } from "../../constants/TableauxConstants";
import getDisplayValue from "../../helpers/getDisplayValue";
import identifyUniqueLinkedRows from "../../helpers/linkHelper";

const mapWithIndex = f.map.convert({ cap: false });

onmessage = function(e) {
  const rows = e.data[0];
  const columns = e.data[1];
  const langtags = e.data[2];
  const tableId = e.data[3];
  initLangtags(langtags);
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
    values: f.map(row => {
      return {
        ...row,
        values: mapWithIndex((value, id) => {
          const column = columns[id];
          if (column.kind === "link") {
            return { tableId: column.toTable, rowIds: f.map("id", value) };
          }
          return getDisplayValue(column)(value);
        }, row.values)
      };
    })(rows)
  };
  const combined = ((displayValues, linkDisplayValues) => {
    const alreadyExistsAt = f.findIndex(
      element => element.tableId === displayValues.tableId,
      linkDisplayValues
    );
    if (alreadyExistsAt === -1) {
      return f.concat(linkDisplayValues, displayValues);
    }
    return f.set([alreadyExistsAt], displayValues, linkDisplayValues);
  })(displayValues, linkDisplayValues);
  postMessage([combined, tableId]);
};
