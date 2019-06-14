import * as f from "lodash/fp";

// TODO: use apiRoutes here
// Either prefix a string or create string from a target object; see urlToTableDestination function
const apiUrl = destination => {
  if (f.isString(destination)) {
    return "/api" + destination;
  } else {
    return urlToTableDestination(destination);
  }
};

// Generate url from a target object; if langtag is given returns apiUrl, else url to table
const urlToTableDestination = ({
  tableId,
  table,
  column,
  columnId,
  row,
  rowId,
  filter = false,
  langtag
} = {}) => {
  const targetTable = tableId || f.get("id", table);
  const targetCol = columnId || f.get("id", column);
  const targetRow = rowId || f.get("id", row);
  const languagePart = langtag ? `/${langtag}` : null;
  const tablePart = `/tables/${targetTable}`;
  const columnPart = f.isNumber(targetCol) ? `/columns/${targetCol}` : "";
  const rowPart = isFinite(targetRow) ? `/rows/${targetRow}` : "";
  const query = filter ? "?filter" : "";
  const url = languagePart
    ? languagePart + tablePart + columnPart + rowPart
    : apiUrl(tablePart + columnPart + rowPart + query);
  return f.contains("undefined", url) ? "/" : url;
};

// Expects either a full Url or a target object
const openInNewTab = destination => {
  window.open(urlToTableDestination(f.assoc("browserUrl", true, destination)));
};

export default apiUrl;
export { urlToTableDestination, openInNewTab };
