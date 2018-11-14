import actionTypes from "./actionTypes";
import {makeRequest} from "../helpers/apiHelper";
import {getAllTables} from "../helpers/apiRoutes";

const {LOAD_TABLES} = actionTypes;

const loadTables = () => {
  return {
    promise: makeRequest({apiRoute: getAllTables(), type: "GET"}),
    actionTypes: ["TABLE_LOADING_DATA", "TABLE_DATA_LOADED", "TABLE_DATA_LOAD_ERROR"]
  };
};

const loadTable = tableId => {
  return {
    type: LOAD_TABLE,
    promise: makeRequest({apiRoute: getAllTables(), type: "GET"}),
    actionTypes: ["request", "RECEIVED_TABLES", "failure"]
  }
}

const actionCreators = {
  loadTables: loadTables
};

export default actionCreators;
