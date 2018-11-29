import actionTypes from "../actionTypes";
import {toObjectById} from '../../helpers/funcHelpers';

const {
  COLUMNS_LOADING_DATA,
  COLUMNS_DATA_LOADED,
  COLUMNS_DATA_LOAD_ERROR
} = actionTypes;

const initialState = {};

const columns = (state = initialState, action) => {
  switch (action.type) {
    case COLUMNS_LOADING_DATA:
      return {...state, [action.tableId]: {error: false, finishedLoading: false}};
    case COLUMNS_DATA_LOADED:
      return {
        ...state,
        [action.tableId]: {
          error: false,
          finishedLoading: true,
          data: action.result.columns
        }
      };
    case COLUMNS_DATA_LOAD_ERROR:
      return {...state, [action.tableId]: {error: action.error, finishedLoading: true}};
    default:
      return state;
  }
};

export default columns;
