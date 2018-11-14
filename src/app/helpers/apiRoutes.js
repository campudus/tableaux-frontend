const getAllTables = () => "/tables";
const getAllColumnsForTable = tableId => "/tables/" + tableId + "/columns";

const API_ROUTES = {
  getAllTables: getAllTables,

}
