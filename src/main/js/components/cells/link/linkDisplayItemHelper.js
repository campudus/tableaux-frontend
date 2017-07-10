import * as f from "lodash/fp";
import getDisplayValue from "../../../models/getDisplayValue";
import Request from "superagent";
import apiUrl from "../../../helpers/apiUrl";

const mkLinkDisplayItem = f.curry(
  function (table, row) {
    const rowData = (f.isString(row)) ? JSON.parse(row) : row;
    const cellData = f.get(["rows", "values"], rowData) || f.get("values", rowData);
    const colData = f.get(["columns", "models"], table);
    const tableId = f.get("id", table);
    const combinedData = f.zip(cellData, colData);

    const mkCell = ([value, col]) => ({
      value: f.defaultTo(value, f.get("value", value)),
      column: col,
      tableId
    });

    const addId = cell => (
      f.assoc("id", `cell-${tableId}-${f.get("id", cell.column)}-${f.get("id", rowData)}`, cell)
    );

    const cell = f.compose(
      addId,
      mkCell,
      f.first
    )(combinedData);

    const displayValue = getDisplayValue(cell.column, cell.value);

    return {
      id: f.get("id", rowData),
      value: f.get("value", cell),
      displayValue
    };
  }
);

const fetchLinkDisplayItem = f.curry(
  function (table, row) {
    const tableId = table.id;
    const rowId = row.id;
    return new Promise(
      function (resolve, reject) {
        Request
          .get(apiUrl(`/tables/${tableId}/rows/${rowId}`))
          .end(
            function (err, response) {
              if (err) {
                reject(new Error(err));
              } else {
                resolve(mkLinkDisplayItem(table, response.text));
              }
            }
          );
      }
    );
  }
);

// TODO: Add tests when fixed testing data structure exists

export {mkLinkDisplayItem, fetchLinkDisplayItem};
