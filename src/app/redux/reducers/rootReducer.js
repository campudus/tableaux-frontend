import {combineReducers} from "redux";

import tables from "./table";
import columns from "./columns";
import rows from "./rows";

const rootReducer = combineReducers({tables, columns, rows});

export default rootReducer;
