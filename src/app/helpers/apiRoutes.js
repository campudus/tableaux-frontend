import f from "lodash/fp";
const urlTrim = url => url.match(/\.*\/?(.*)\/?/)[1];
const cleanUrlPart = f.flow(
  f.toString,
  urlTrim
);
const joinUrlParts = (...args) => args.map(cleanUrlPart).join("/");

const toQSValue = (key, value) => `${key}=${encodeURIComponent(value)}`;
export const toQueryString = params =>
  f.compose(
    f.reduce(
      (query, [key, value]) =>
        `${query}&` +
        (Array.isArray(value)
          ? value.map(v => toQSValue(key, v)).join("&")
          : toQSValue(key, value)),
      ""
    ),
    f.toPairs
  )(params);

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

const toSetting = setting => `/system/settings/${setting}`;

const toFolder = (folderId, langtag) =>
  (folderId ? `/folders/${folderId}` : "/folders") +
  (langtag ? "?langtag=" + langtag : "");

const toFile = (fileId, langtag) =>
  (fileId ? `/files/${fileId}` : "/files") +
  (langtag ? "?langtag=" + langtag : "");

const toServiceRegistry = () => "/system/services";
const toFrontendServiceView = (id, langtag, params = {}) => {
  const baseUrl = `/${langtag}/services/${id}`;
  return f.compose(
    str => `${str}?${toQueryString(params)}`,
    f.join("/"),
    f.compact
  )([
    baseUrl,
    params.tableId && `tables/${params.tableId}`,
    params.columnId && `columns/${params.columnId}`,
    params.rowId && `rows/${params.rowId}`
  ]);
};

const toCellHistory = ({ tableId, rowId, columnId }) =>
  toCell({ tableId, rowId, columnId }) + "/history";

const toAnnotationConfigs = () => "/system/annotations";

const API_ROUTES = {
  joinUrlParts,
  getAllTables,
  getAllColumnsForTable,
  toRows,
  toTable,
  toColumn,
  toAllColumns: getAllColumnsForTable,
  toRow,
  toCell,
  toFolder,
  toFile,
  toSetting,
  toServiceRegistry,
  toFrontendServiceView,
  toCellHistory,
  toAnnotationConfigs
};

export default API_ROUTES;
