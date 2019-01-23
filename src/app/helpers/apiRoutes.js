import { flow, join, map, toString, isInteger } from "lodash/fp";
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
const toColumn = ({ tableId, columnId }) =>
  "/" + joinUrlParts("tables", tableId, "columns", columnId);
const toRow = ({ tableId, rowId }) =>
  "/" + joinUrlParts("tables", tableId, "rows", rowId);
const toCell = ({ tableId, rowId, columnId }) =>
  "/" + joinUrlParts("tables", tableId, "columns", columnId, "rows", rowId);

const toFolder = folderId =>
  isInteger(folderId) ? `/folders/${folderId}` : "/folders";

const getMediaFolderRoute = (folderId, langtag) =>
  "/folders" + (folderId ? "/" + folderId : "") + "?langtag=" + langtag;
const createMediaFolderRoute = () => "/folders";
const alterMediaFolderRoute = folderId => "/folders/" + folderId;

const API_ROUTES = {
  getAllTables,
  getAllColumnsForTable,
  getAllRowsForTable,
  toColumn,
  toRow,
  toCell,
  toFolder,
  getMediaFolderRoute,
  createMediaFolderRoute,
  alterMediaFolderRoute
};

export default API_ROUTES;
