import actionTypes from "../actionTypes";
import {toObjectById} from '../../helpers/funcHelpers';

const {
  ALL_ROWS_LOADING_DATA,
  ALL_ROWS_DATA_LOADED,
  ALL_ROWS_DATA_LOAD_ERROR
} = actionTypes;

const initialState = {};

const rows = (state = initialState, action) => {
  switch (action.type) {
    case ALL_ROWS_LOADING_DATA:
      return {...state, [action.tableId]: {error: false, finishedLoading: false}};
    case ALL_ROWS_DATA_LOADED:
      return {
        ...state,
        [action.tableId]: {
          error: false,
          finishedLoading: true,
          data: action.result.rows
        }
      };
    case ALL_ROWS_DATA_LOAD_ERROR:
      return {...state, [action.tableId]: {error: action.error, finishedLoading: true}};
    default:
      return state;
  }
};

export default rows;
