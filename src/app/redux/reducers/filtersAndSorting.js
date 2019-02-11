import actionTypes from "../actionTypes";
const { APPLY_FILTERS_AND_SORTING} = actionTypes;

const defaultState = {
  filters: [],
  sorting: {}
};
export default (state = defaultState, action, completeState) => {
  switch (action.type) {
    case APPLY_FILTERS_AND_SORTING:
      return { ...state, filters: action.filters, sorting: action.sorting };
    default:
      return state;
  }
};
