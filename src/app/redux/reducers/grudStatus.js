import f from "lodash/fp";
import ActionTypes from "../actionTypes";

const { SET_STATUS_INFO } = ActionTypes;

const initialState = {
  connectedToBackend: true
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SET_STATUS_INFO: {
      const { key, value } = action;
      return f.assoc(key, value, state);
    }
    default:
      return state;
  }
};
