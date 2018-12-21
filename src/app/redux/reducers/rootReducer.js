import tables from "./table";
import columns from "./columns";
import rows from "./rows";
import tableView from "./tableView";
import { omniscentReducer } from "./omniscentReducer";

// const rootReducer = combineReducers({ tables, columns, rows, tableView });
const rootReducer = omniscentReducer({ tables, columns, rows, tableView });

export default rootReducer;
