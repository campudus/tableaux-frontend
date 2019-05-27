import { frontendServices } from "./frontendServices";
import { omniscentReducer } from "./omniscentReducer";
import columns from "./columns";
import grudStatus from "./grudStatus";
import media from "./media";
import overlays from "./overlays";
import rows from "./rows";
import tableView from "./tableView";
import tables from "./table";

// const rootReducer = combineReducers({ tables, columns, rows, tableView });
const rootReducer = omniscentReducer({
  tables,
  columns,
  rows,
  tableView,
  overlays,
  media,
  grudStatus,
  frontendServices
});

export default rootReducer;
