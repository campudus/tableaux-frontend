import tables from "./table";
import columns from "./columns";
import rows from "./rows";
import tableView from "./tableView";
import overlays from "./overlays";
import media from "./media";
import { omniscentReducer } from "./omniscentReducer";

// const rootReducer = combineReducers({ tables, columns, rows, tableView });
const rootReducer = omniscentReducer({
  tables,
  columns,
  rows,
  tableView,
  overlays,
  media
});

export default rootReducer;
