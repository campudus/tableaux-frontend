import actionTypes from "../actionTypes";
import { toObjectById } from "../../helpers/funcHelpers";

const {
  TABLE_LOADING_DATA,
  TABLE_DATA_LOADED,
  TABLE_DATA_LOAD_ERROR
} = actionTypes;

const initialState = {
  finishedLoading: false,
  error: false,
  data: {}
};

const tables = (state = initialState, action) => {
  switch (action.type) {
    case TABLE_LOADING_DATA:
      return { ...state, error: false, finishedLoading: false };
    case TABLE_DATA_LOADED:
      return {
        ...state,
        error: false,
        finishedLoading: true,
        data: toObjectById(action.result.tables)
      };
    case TABLE_DATA_LOAD_ERROR:
      return { ...state, error: true, finishedLoading: true };
    default:
      return state;
  }
};

export default tables;
