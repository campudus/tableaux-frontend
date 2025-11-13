import f from "lodash/fp";
import { initLangtags } from "../../constants/TableauxConstants";
import { buildOriginColumnLookup } from "../../helpers/columnHelper";
import getDisplayValue from "../../helpers/getDisplayValue";
import { buildLinkDisplayValueCache } from "../../helpers/linkHelper";

const mapWithIndex = f.map.convert({ cap: false });

onmessage = function(e) {
  const [rows, columns, langtags, table] = e.data;
  const tableId = table.id;
  initLangtags(langtags);
  const uniqueLinks = buildLinkDisplayValueCache(table, columns, rows);
  const linkDisplayValues = f.map(outer => {
    return {
      tableId: outer.tableId,
      values: f.map(value => {
        return { id: value.id, values: getDisplayValue(outer.column, [value]) };
      }, outer.values)
    };
  }, uniqueLinks);

  const getOriginColumn = buildOriginColumnLookup(table, columns);
  const getRowDisplayValues = row => {
    const values = mapWithIndex((value, idx) => {
      const column = columns[idx];
      const originColumn = getOriginColumn(column.id, row.tableId);
      if (column.kind === "link") {
        return { tableId: column.toTable, rowIds: f.map("id", value) };
      }
      return getDisplayValue(originColumn || column, value);
    }, row.values);

    return {
      ...row,
      values
    };
  };

  const displayValues = {
    tableId,
    values: f.map(getRowDisplayValues, rows)
  };
  const combined = ((displayValues, linkDisplayValues) => {
    const alreadyExistsAt =
      f.findIndex(
        element => element.tableId === displayValues.tableId,
        linkDisplayValues
      ) >= 0;
    return alreadyExistsAt
      ? f.set([alreadyExistsAt], displayValues, linkDisplayValues)
      : f.concat(linkDisplayValues, displayValues);
  })(displayValues, linkDisplayValues);
  postMessage([combined, tableId]);
};
