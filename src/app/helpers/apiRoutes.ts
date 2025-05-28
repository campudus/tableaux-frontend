import f from "lodash/fp";
import { TableParams } from "../types/grud";

const urlTrim = (url: string) => url.match(/\.*\/?(.*)\/?/)?.at(1);

const cleanUrlPart = f.flow(f.toString, urlTrim);

export const joinUrlParts = (...args: (string | number)[]) =>
  args.map(cleanUrlPart).join("/");

export const toQSValue = (key: string, value: string | number | boolean) =>
  `${key}=${encodeURIComponent(value)}`;

export const toQueryString = (
  params: Record<string, string | number | boolean>
) =>
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

export const getAllTables = () => "/tables";

export const getAllColumnsForTable = (tableId: TableParams["tableId"]) =>
  "/tables/" + tableId + "/columns";

export const toRows = (tableId: TableParams["tableId"]) =>
  "/tables/" + tableId + "/rows";

export const toTable = ({ tableId }: Pick<TableParams, "tableId">) =>
  "/tables/" + tableId;

export const toColumn = ({
  tableId,
  columnId
}: Pick<TableParams, "tableId" | "columnId">) =>
  f.isInteger(columnId)
    ? "/" + joinUrlParts("tables", tableId, "columns", columnId)
    : "/" + joinUrlParts("tables", tableId, "columns");

export const toRow = ({
  tableId,
  rowId
}: Pick<TableParams, "tableId" | "rowId">) =>
  "/" + joinUrlParts("tables", tableId, "rows", rowId);

export const toCell = ({ tableId, rowId, columnId }: TableParams) =>
  "/" + joinUrlParts("tables", tableId, "columns", columnId, "rows", rowId);

export const toSetting = (setting: string) => `/system/settings/${setting}`;

export const toFolder = (folderId?: string | number | null, langtag?: string) =>
  (folderId ? `/folders/${folderId}` : "/folders") +
  (langtag ? "?langtag=" + langtag : "");

export const toFile = (fileId?: string | number, langtag?: string) =>
  (fileId ? `/files/${fileId}` : "/files") +
  (langtag ? "?langtag=" + langtag : "");

export const toFileDependents = (fileId: string | number) =>
  `/files/${fileId}/dependent`;

export const toFileUpload = (fileId: string | number, langtag: string) =>
  `/files/${fileId}/${langtag}`;

export const toServiceRegistry = () => "/system/services";

export const toFrontendServiceView = (
  id: string | number,
  langtag: string,
  params = {} as Partial<TableParams>
) => {
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

export const toCellHistory = ({ tableId, rowId, columnId }: TableParams) =>
  toCell({ tableId, rowId, columnId }) + "/history";

export const toAnnotationConfigs = () => "/system/annotations";

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
