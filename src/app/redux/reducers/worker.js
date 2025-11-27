import f from "lodash/fp";
import { initLangtags } from "../../constants/TableauxConstants";
import {
  buildOriginColumnLookup,
  getConcatOrigin
} from "../../helpers/columnHelper";
import getDisplayValue from "../../helpers/getDisplayValue";
import { buildLinkDisplayValueCache } from "../../helpers/linkHelper";
import { ColumnKind } from "@grud/devtools/types";

const mapWithIndex = f.map.convert({ cap: false });

// Returns: Array<{ tableId: number, values: Array<Pick<Row, 'id' | 'values'>> }>
onmessage = function(e) {
  const [rows, columns, langtags, table] = e.data;
  const tableId = table.id;
  initLangtags(langtags);
  const linkDisplayValueLookup = buildLinkDisplayValueCache(
    table,
    columns,
    rows
  );
  const getOriginColumn = buildOriginColumnLookup(table, columns);
  const uniqueLinks = f.mapValues(f.indexBy("id"), linkDisplayValueLookup);
  const getLinkDisplayValue = (tableId, rowId) =>
    f.prop([tableId, rowId, "value", 0], uniqueLinks);

  const linkDisplayValues = Object.entries(uniqueLinks).map(
    ([toTableIdStr, rows]) => {
      const toTableId = parseInt(toTableIdStr);
      const rowValues = Object.entries(rows).map(([rowId, value]) => ({
        id: rowId,
        values: [getLinkDisplayValue(toTableId, value.id)]
      }));
      return {
        tableId: toTableId,
        values: rowValues
      };
    }
  );

  const getRowDisplayValues = row => {
    const values = mapWithIndex((value, idx) => {
      const column = columns[idx];
      const originColumn = getOriginColumn(column.id, row.tableId);
      const toTableId = row.tableId ?? originColumn?.toTable ?? column.toTable;
      switch (column.kind) {
        case ColumnKind.link:
          return value.map(link => getLinkDisplayValue(toTableId, link.id));
        case ColumnKind.concat: {
          const concatColumn = getConcatOrigin(
            tableId,
            column,
            row.tableId ?? tableId
          );
          return getDisplayValue(concatColumn, value);
        }
        default:
          return getDisplayValue(originColumn ?? column, value);
      }
    }, row.values);

    return {
      ...row,
      values
    };
  };

  const localDisplayValues = {
    tableId,
    values: f.map(getRowDisplayValues, rows)
  };

  const combined = [localDisplayValues].concat(linkDisplayValues);

  postMessage([combined, tableId]);
};
