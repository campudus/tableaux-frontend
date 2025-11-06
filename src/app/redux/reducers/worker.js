import f from "lodash/fp";
import { initLangtags } from "../../constants/TableauxConstants";
import { buildOriginColumnLookup } from "../../helpers/columnHelper";
import getDisplayValue from "../../helpers/getDisplayValue";
import identifyUniqueLinkedRows from "../../helpers/linkHelper";

const mapWithIndex = f.map.convert({ cap: false });

onmessage = function(e) {
  const [rows, columns, langtags, table] = e.data;
  const tableId = table.id;
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
  const getOriginColumn = buildOriginColumnLookup(table, columns);
  const displayValues = {
    tableId,
    values: f.map(row => {
      return {
        ...row,
        values: mapWithIndex((value, idx) => {
          const column = columns[idx];
          const originColumn = getOriginColumn(column.id, row.tableId);
          if (column.kind === "link") {
            return { tableId: column.toTable, rowIds: f.map("id", value) };
          }
          return getDisplayValue(originColumn ?? column)(value);
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
