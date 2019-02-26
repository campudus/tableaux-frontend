import f from "lodash/fp";
const urlTrim = url => url.match(/\.*\/?(.*)\/?/)[1];
const cleanUrlPart = f.flow(
  f.toString,
  urlTrim
);
const joinUrlParts = (...args) => args.map(cleanUrlPart).join("/");

const getAllTables = () => "/tables";
const getAllColumnsForTable = tableId => "/tables/" + tableId + "/columns";
const toRows = tableId => "/tables/" + tableId + "/rows";
const toTable = ({ tableId }) => "/tables/" + tableId;
const toColumn = ({ tableId, columnId }) =>
  f.isInteger(columnId)
    ? "/" + joinUrlParts("tables", tableId, "columns", columnId)
    : "/" + joinUrlParts("tables", tableId, "columns");
const toRow = ({ tableId, rowId }) =>
  "/" + joinUrlParts("tables", tableId, "rows", rowId);
const toCell = ({ tableId, rowId, columnId }) =>
  "/" + joinUrlParts("tables", tableId, "columns", columnId, "rows", rowId);

const toFolder = (folderId, langtag) =>
  (folderId ? `/folders/${folderId}` : "/folders") +
  (langtag ? "?langtag=" + langtag : "");

const toFile = (fileId, langtag) =>
  (fileId ? `/files/${fileId}` : "/files") +
  (langtag ? "?langtag=" + langtag : "");

const API_ROUTES = {
  getAllTables,
  getAllColumnsForTable,
  toRows,
  toTable,
  toColumn,
  toRow,
  toCell,
  toFolder,
  toFile
};

export default API_ROUTES;
