const getAllTables = () => "/tables";
const getAllColumnsForTable = tableId => "/tables/" + tableId + "/columns";
const getAllRowsForTable = tableId => "/tables/" + tableId + "/rows";

const API_ROUTES = {
  getAllTables: getAllTables,
  getAllColumnsForTable,
  getAllRowsForTable
}
export default API_ROUTES;
