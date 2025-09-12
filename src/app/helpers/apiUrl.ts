import * as f from "lodash/fp";
import { Column, Row, Table, TableParams } from "../types/grud";

export type UrlProps = {
  langtag?: string;
  filter?: boolean;
  table?: Table;
  column?: Column;
  row?: Row;
} & Partial<TableParams>;

type PreviewUrlProps = {
  langtag: string;
  tableId: number | string;
  rowId: number | string;
  columnId?: number | string;
};

// TODO: use apiRoutes here
// Either prefix a string or create string from a target object; see urlToTableDestination function
const apiUrl = (destination: string | UrlProps): string => {
  if (f.isString(destination)) {
    return "/api" + destination;
  } else {
    return urlToTableDestination(destination);
  }
};

// Generate url from a target object; if langtag is given returns apiUrl, else url to table
const urlToTableDestination = (props: UrlProps = {}): string => {
  const { langtag, filter = false } = props;
  const { tableId, table, column, columnId, row, rowId } = props;
  const targetTable = tableId || f.get("id", table);
  const targetCol = columnId || f.get("id", column);
  const targetRow = rowId || f.get("id", row);
  const languagePart = langtag ? `/${langtag}` : null;
  const tablePart = `/tables/${targetTable}`;
  const columnPart = f.isNumber(targetCol) ? `/columns/${targetCol}` : "";
  const rowPart = f.isNumber(targetRow) ? `/rows/${targetRow}` : "";
  const query = filter ? "?filter" : "";
  const url = languagePart
    ? languagePart + tablePart + columnPart + rowPart
    : apiUrl(tablePart + columnPart + rowPart + query);
  return f.contains("undefined", url) ? "/" : url;
};

// Expects either a full Url or a target object
const openInNewTab = (destination: UrlProps) => {
  window.open(urlToTableDestination(f.assoc("browserUrl", true, destination)));
};

const previewUrl = ({
  langtag,
  tableId,
  rowId,
  columnId
}: PreviewUrlProps): string => {
  return columnId
    ? `/${langtag}/preview/${tableId}/columns/${columnId}/rows/${rowId}`
    : `/${langtag}/preview/${tableId}/rows/${rowId}`;
};

export default apiUrl;
export { urlToTableDestination, openInNewTab, previewUrl };
