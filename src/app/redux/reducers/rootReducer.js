import {combineReducers} from "redux";

import tables from "./table";
import columns from "./columns";
import rows from "./rows";
import tableView from "./tableView";

const rootReducer = combineReducers({tables, columns, rows, tableView});

export default rootReducer;
