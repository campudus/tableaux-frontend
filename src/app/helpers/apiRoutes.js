import { flow, join, map, toString } from "lodash/fp";
const urlTrim = url => url.match(/\.*\/?(.*)\/?/)[1];
const joinUrlParts = (...args) =>
  flow(
    map(
      flow(
        toString,
        urlTrim
      )
    ),

    join("/")
  )(args);

const getAllTables = () => "/tables";
const getAllColumnsForTable = tableId => "/tables/" + tableId + "/columns";
const getAllRowsForTable = tableId => "/tables/" + tableId + "/rows";
const toCell = ({ tableId, rowId, columnId }) =>
  "/" + joinUrlParts("tables", tableId, "columns", columnId, "rows", rowId);

const API_ROUTES = {
  getAllTables: getAllTables,
  getAllColumnsForTable,
  getAllRowsForTable,
  toCell
};

export default API_ROUTES;
